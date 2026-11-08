from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework.decorators import (
    api_view,
    permission_classes
)

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from turnos.models import VisitorSession
from .models import PushSubscription


@api_view(["POST"])
@permission_classes([AllowAny])
def registrar_suscripcion(request):

    fid = request.data.get("fid")

    visitor_session_id = request.data.get(
        "visitor_session_id"
    )

    # Validar los datos recibidos.
    if not fid or not visitor_session_id:

        return Response(
            {
                "error": "Se requiere FID y sesión de visitante."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validar la sesión del ciudadano.
    sesion = get_object_or_404(
        VisitorSession,
        id=visitor_session_id,
        is_active=True
    )

    # Registrar o actualizar la suscripción.
    suscripcion, creada = (
        PushSubscription.objects.update_or_create(
            fid=fid,
            defaults={
                "visitor_session": sesion,
                "active": True,
                "last_seen_at": timezone.now()
            }
        )
    )

    return Response(
        {
            "message": "Dispositivo registrado correctamente.",
            "subscription_id": suscripcion.id,
            "created": creada
        },
        status=(
            status.HTTP_201_CREATED
            if creada
            else status.HTTP_200_OK
        )
    )