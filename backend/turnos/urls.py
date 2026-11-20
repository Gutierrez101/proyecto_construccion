from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServicioViewSet, TurnoViewSet, login_usuario

router = DefaultRouter()
router.register(r'servicios', ServicioViewSet)
router.register(r'turnos', TurnoViewSet)

urlpatterns = [
    path('login/', login_usuario, name='login'),
    path('', include(router.urls)),
]