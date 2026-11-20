from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import Servicio, Turno

class ServicioSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(validators=[UniqueValidator(queryset=Servicio.objects.all(), message='Ya existe un servicio con ese nombre.')])

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

    def validate_servicio(self, servicio):
        if not servicio.activo:
            raise serializers.ValidationError('El servicio seleccionado no está disponible.')
        return servicio
