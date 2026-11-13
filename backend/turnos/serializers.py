from rest_framework import serializers
from .models import Servicio, Turno

class ServicioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servicio
        fields = '__all__'

class TurnoSerializer(serializers.ModelSerializer):
    servicio_nombre = serializers.ReadOnlyField(source='servicio.nombre')
    
    class Meta:
        model = Turno
        fields = '__all__'
        # Le decimos a Django que NO pida estos campos al crear un turno:
        read_only_fields = ['codigo_turno', 'estado', 'fecha_creacion', 'fecha_atencion', 'empleado']