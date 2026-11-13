from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from .models import Servicio, Turno
from .serializers import ServicioSerializer, TurnoSerializer
import firebase_admin
from firebase_admin import credentials, messaging
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets, status
import os

# Inicializar Firebase (asegúrate de que la ruta al JSON sea correcta)
if not firebase_admin._apps:
    cred_path = os.path.join(settings.BASE_DIR, 'secrets', 'firebase-admin.json')
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)


class ServicioViewSet(viewsets.ModelViewSet):
    queryset = Servicio.objects.filter(activo=True)
    serializer_class = ServicioSerializer

class TurnoViewSet(viewsets.ModelViewSet):
    queryset = Turno.objects.all().order_by('fecha_creacion')
    serializer_class = TurnoSerializer

    def get_permissions(self):
        if self.action=='create':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    # Vista para el empleado: llamar al siguiente turno
    @action(detail=False, methods=['post'])
    def llamar_siguiente(self, request):
        servicio_id = request.data.get('servicio_id')
        turno = Turno.objects.filter(servicio_id=servicio_id, estado='PENDIENTE').first()
        
        if turno:
            turno.estado = 'LLAMANDO'
            if request.user.is_authenticated:
                turno.empleado = request.user
            else:
                turno.empleado = User.objects.first()
            
            turno.save()

            if turno.fcm_token:
                try:
                    mensaje = messaging.Message(
                        notification=messaging.Notification(
                            title="¡Es tu turno!",
                            body=f"Acércate a la ventanilla. Turno: {turno.codigo_turno}",
                        ),
                        webpush=messaging.WebpushConfig(
                            notification=messaging.WebpushNotification(
                                icon="/icons/icon-192.png",
                                vibrate=[200, 100, 200, 100, 200],
                                require_interaction=True
                            )
                        ),
                        token=turno.fcm_token,
                    )
                    messaging.send(mensaje)
                except Exception as e:
                    print("Error enviando push:", e)
            return Response(TurnoSerializer(turno).data)
        return Response({"mensaje": "No hay turnos pendientes en este servicio"}, status=status.HTTP_404_NOT_FOUND)

    # Vista para el empleado: iniciar o completar atención
    @action(detail=True, methods=['patch'])
    def actualizar_estado(self, request, pk=None):
        turno = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado in dict(Turno.ESTADOS).keys():
            turno.estado = nuevo_estado
            if nuevo_estado == 'COMPLETADO':
                turno.fecha_atencion = timezone.now()
            turno.save()
            return Response(TurnoSerializer(turno).data)
        return Response({"error": "Estado inválido"}, status=status.HTTP_400_BAD_REQUEST)

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