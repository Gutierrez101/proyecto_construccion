import os
import firebase_admin
from firebase_admin import credentials, messaging

from django.conf import settings
from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .models import Servicio, Turno
from .serializers import ServicioSerializer, TurnoSerializer

# Inicializar Firebase Admin SDK
if not firebase_admin._apps:
    cred_path = os.path.join(settings.BASE_DIR, 'secrets', 'firebase-admin.json')
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_usuario(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)

    if user is not None:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'username': user.username,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff
        })
    return Response({'error': 'Usuario o contraseña incorrectos'}, status=status.HTTP_401_UNAUTHORIZED)


class ServicioViewSet(viewsets.ModelViewSet):
    queryset = Servicio.objects.filter(activo=True)
    serializer_class = ServicioSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]


class TurnoViewSet(viewsets.ModelViewSet):
    queryset = Turno.objects.all().order_by('id')
    serializer_class = TurnoSerializer

    def get_permissions(self):
        # El ciudadano puede crear su turno y consultar su posición en la fila sin iniciar sesión
        if self.action in ['create', 'estado_cola']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def _enviar_push_individual(self, token, titulo, cuerpo):
        if not token or not firebase_admin._apps:
            return
        try:
            mensaje = messaging.Message(
                notification=messaging.Notification(
                    title=titulo,
                    body=cuerpo,
                ),
                webpush=messaging.WebpushConfig(
                    notification=messaging.WebpushNotification(
                        icon="/icons/icon-192.png",
                        badge="/icons/icon-192.png",
                        vibrate=[200, 100, 200, 100, 200],
                        require_interaction=True
                    )
                ),
                token=token,
            )
            messaging.send(mensaje)
        except Exception as e:
            print(f"Error enviando notificación individual: {e}")

    def _notificar_avance_cola(self, servicio_id):
        """Notifica a todos los turnos PENDIENTES de un servicio cuántos turnos faltan antes que ellos."""
        if not firebase_admin._apps:
            return

        pendientes = Turno.objects.filter(
            servicio_id=servicio_id,
            estado='PENDIENTE'
        ).order_by('id')

        mensajes = []
        for posicion, turno_pendiente in enumerate(pendientes):
            if not turno_pendiente.fcm_token:
                continue

            if posicion == 0:
                cuerpo = f"Turno {turno_pendiente.codigo_turno}: ¡Prepárate! Eres el siguiente en ser atendido."
            elif posicion == 1:
                cuerpo = f"Turno {turno_pendiente.codigo_turno}: Falta 1 turno antes que el tuyo."
            else:
                cuerpo = f"Turno {turno_pendiente.codigo_turno}: Faltan {posicion} turnos antes que el tuyo."

            mensajes.append(
                messaging.Message(
                    notification=messaging.Notification(
                        title="Avance de la fila",
                        body=cuerpo,
                    ),
                    webpush=messaging.WebpushConfig(
                        notification=messaging.WebpushNotification(
                            icon="/icons/icon-192.png",
                            badge="/icons/icon-192.png",
                            vibrate=[150, 100, 150],
                        )
                    ),
                    token=turno_pendiente.fcm_token,
                )
            )

        if mensajes:
            try:
                messaging.send_each(mensajes)
            except Exception as e:
                print(f"Error enviando notificaciones masivas de cola: {e}")

    # API PÚBLICA PARA EL CIUDADANO: Consultar posición y avance de la fila
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def estado_cola(self, request, pk=None):
        turno = self.get_object()

        # Turno que está siendo llamado o atendido actualmente en el mismo servicio
        turno_actual = (
            Turno.objects.filter(
                servicio=turno.servicio,
                estado__in=['LLAMANDO', 'EN_ATENCION']
            )
            .order_by('-id')
            .first()
        )

        # Calcular cuántos turnos pendientes fueron creados antes que este turno
        if turno.estado == 'PENDIENTE':
            turnos_adelante = Turno.objects.filter(
                servicio=turno.servicio,
                estado='PENDIENTE',
                id__lt=turno.id
            ).count()
        else:
            turnos_adelante = 0

        # Mensaje descriptivo según el estado y posición
        if turno.estado == 'LLAMANDO':
            mensaje = "¡ES TU TURNO! Acércate a la ventanilla de atención."
        elif turno.estado == 'EN_ATENCION':
            mensaje = "Estás siendo atendido en este momento."
        elif turno.estado == 'COMPLETADO':
            mensaje = "Tu trámite ha finalizado. ¡Gracias por tu visita!"
        elif turno.estado == 'CANCELADO':
            mensaje = "Este turno fue cancelado."
        elif turnos_adelante == 0:
            mensaje = "¡Prepárate! Eres el siguiente en ser llamado."
        elif turnos_adelante == 1:
            mensaje = "Falta 1 turno antes que el tuyo."
        else:
            mensaje = f"Faltan {turnos_adelante} turnos antes que el tuyo."

        return Response({
            "id": turno.id,
            "codigo_turno": turno.codigo_turno,
            "ciudadano_nombre": turno.ciudadano_nombre,
            "servicio_nombre": turno.servicio.nombre,
            "estado": turno.estado,
            "turnos_adelante": turnos_adelante,
            "turno_actual": turno_actual.codigo_turno if turno_actual else "En espera",
            "mensaje": mensaje
        })

    # ACCIÓN DEL EMPLEADO: Llamar al siguiente turno y notificar a toda la fila
    @action(detail=False, methods=['post'])
    def llamar_siguiente(self, request):
        servicio_id = request.data.get('servicio_id')
        turno = Turno.objects.filter(servicio_id=servicio_id, estado='PENDIENTE').order_by('id').first()

        if turno:
            turno.estado = 'LLAMANDO'
            turno.empleado = request.user if request.user.is_authenticated else User.objects.first()
            turno.save()

            # 1. Notificar al ciudadano que le toca pasar ahora mismo
            self._enviar_push_individual(
                token=turno.fcm_token,
                titulo="¡Es tu turno!",
                cuerpo=f"Turno {turno.codigo_turno}: Por favor acércate a la ventanilla."
            )

            # 2. Notificar a los demás ciudadanos en espera cuántos turnos faltan antes que ellos
            self._notificar_avance_cola(servicio_id)

            return Response(TurnoSerializer(turno).data)

        return Response({"mensaje": "No hay turnos pendientes en este servicio"}, status=status.HTTP_404_NOT_FOUND)

    # ACCIÓN DEL EMPLEADO: Iniciar atención, completar o cancelar turno
    @action(detail=True, methods=['patch'])
    def actualizar_estado(self, request, pk=None):
        turno = self.get_object()
        nuevo_estado = request.data.get('estado')

        if nuevo_estado in dict(Turno.ESTADOS).keys():
            turno.estado = nuevo_estado
            if nuevo_estado == 'COMPLETADO':
                turno.fecha_atencion = timezone.now()
            turno.save()

            # Si se canceló un turno pendiente, actualizar la posición de los que siguen atrás
            if nuevo_estado == 'CANCELADO':
                self._notificar_avance_cola(turno.servicio_id)

            return Response(TurnoSerializer(turno).data)

        return Response({"error": "Estado inválido"}, status=status.HTTP_400_BAD_REQUEST)