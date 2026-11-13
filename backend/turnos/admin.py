from django.contrib import admin
from .models import Servicio, Turno, VisitorSession

# Configuración visual para Servicios
@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'codigo', 'activo')
    search_fields = ('nombre', 'codigo')

# Configuración visual para Turnos
@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    list_display = ('codigo_turno', 'ciudadano_nombre', 'servicio', 'estado', 'fecha_creacion')
    list_filter = ('estado', 'servicio')
    search_fields = ('codigo_turno', 'ciudadano_nombre', 'ciudadano_identificacion')

# Registramos también VisitorSession por si necesitas verlo
admin.site.register(VisitorSession)