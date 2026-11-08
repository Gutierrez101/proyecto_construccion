from django.urls import path

from .views import registrar_suscripcion


urlpatterns = [

    path(
        "suscripciones/",
        registrar_suscripcion,
        name="registrar_suscripcion"
    ),

]