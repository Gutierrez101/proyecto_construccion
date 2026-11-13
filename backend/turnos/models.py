from django.db import models
from django.contrib.auth.models import User

class Servicio(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    codigo = models.CharField(max_length=10, unique=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

#Clase de sesiones
class VisitorSession(models.Model):
    is_active = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sesión {self.id} - Activa: {self.is_active}"

class Turno(models.Model):
    ESTADOS = [
        ('PENDIENTE', 'Pendiente'),
        ('LLAMANDO', 'Llamando'),
        ('EN_ATENCION', 'En Atención'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
    ]

    codigo_turno = models.CharField(max_length=20)
    ciudadano_nombre = models.CharField(max_length=150)
    ciudadano_identificacion = models.CharField(max_length=20)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_atencion = models.DateTimeField(null=True, blank=True)
    
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name='turnos')
    empleado = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='turnos_atendidos')
    fcm_token=models.CharField(max_length=255, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.codigo_turno:
            ultimo_turno = Turno.objects.filter(servicio=self.servicio).count() + 1
            self.codigo_turno = f"{self.servicio.codigo}-{ultimo_turno:03d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.codigo_turno} - {self.ciudadano_nombre}"