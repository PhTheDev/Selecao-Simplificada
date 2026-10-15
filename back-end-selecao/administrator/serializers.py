from rest_framework import serializers  # type: ignore
from django.contrib.auth.models import User  # type: ignore
from django.contrib.auth.password_validation import validate_password  # type: ignore
from django.contrib.auth import authenticate  # type: ignore

from .models import AdministratorProfile, MATRICULA_VALIDATOR
from .choices import AdministratorRole


def _validate_matricula_unique(matricula: str, instance: AdministratorProfile | None = None):
    if not matricula:
        return
    qs = AdministratorProfile.objects.filter(matricula=matricula)
    if instance:
        qs = qs.exclude(pk=instance.pk)
    if qs.exists():
        raise serializers.ValidationError({"matricula": "Esta matrícula já está cadastrada."})


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_superuser']


class AdministratorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = AdministratorProfile
        fields = [
            'id', 'user', 'full_name', 'email', 'matricula', 'role', 'department',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AdministratorRegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    role = serializers.ChoiceField(choices=AdministratorRole.choices, required=False)
    department = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    matricula = serializers.CharField(required=True, validators=[MATRICULA_VALIDATOR])

    class Meta:
        model = AdministratorProfile
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'department', 'matricula'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "As senhas não coincidem."})

        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "Este nome de usuário já está em uso."})

        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Este email já está cadastrado."})

        matricula = (attrs.get('matricula') or '').strip()
        if not matricula:
            raise serializers.ValidationError({"matricula": "Matrícula é obrigatória."})
        attrs['matricula'] = matricula
        _validate_matricula_unique(matricula)

        attrs['role'] = AdministratorRole.SUPER_ADMIN
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('password_confirm', None)
        matricula = validated_data.pop('matricula')

        department = validated_data.get('department') or ''

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=password,
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
        )

        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.save()

        administrator = AdministratorProfile.objects.create(
            user=user,
            role=AdministratorRole.SUPER_ADMIN,
            department=department,
            matricula=matricula,
            is_active=True
        )
        return administrator


class AdministratorLoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True, allow_blank=False)
    password = serializers.CharField(required=True, allow_blank=False, write_only=True)

    def validate(self, attrs):
        username = (attrs.get('username') or '').strip()
        password = attrs.get('password') or ''

        if not username:
            raise serializers.ValidationError({"username": "Informe o usuário."})
        if not password:
            raise serializers.ValidationError({"password": "Informe a senha."})

        request = self.context.get("request")
        user = authenticate(request=request, username=username, password=password)

        if not user:
            raise serializers.ValidationError({"detail": "Credenciais inválidas."})

        if not user.is_active:
            raise serializers.ValidationError({"detail": "Esta conta está desativada."})

        try:
            administrator_profile = user.administrator_profile
        except AdministratorProfile.DoesNotExist:
            raise serializers.ValidationError({"detail": "Este usuário não tem permissão de administrador."})

        if not administrator_profile.is_active:
            raise serializers.ValidationError({"detail": "Este perfil de administrador está desativado."})

        attrs['user'] = user
        attrs['administrator_profile'] = administrator_profile
        return attrs


class AdministratorUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', required=False)
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    email = serializers.EmailField(source='user.email', required=False)

    password = serializers.CharField(write_only=True, required=False, allow_blank=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=False, allow_blank=True)
    matricula = serializers.CharField(required=False, allow_blank=True, validators=[MATRICULA_VALIDATOR])

    class Meta:
        model = AdministratorProfile
        fields = [
            'username', 'first_name', 'last_name', 'email', 'role',
            'department', 'matricula', 'is_active',
            'password', 'password_confirm'
        ]

    def validate(self, attrs):
        user_data = attrs.get('user', {}) or {}
        instance_user = getattr(self.instance, "user", None)

        username = (user_data.get('username') or '').strip()
        email = (user_data.get('email') or '').strip()
        password = (attrs.get('password') or '').strip()
        password_confirm = (attrs.get('password_confirm') or '').strip()

        if 'username' in user_data:
            if not username:
                raise serializers.ValidationError({"username": "O nome de usuário não pode ficar vazio."})
            username_qs = User.objects.filter(username=username)
            if instance_user:
                username_qs = username_qs.exclude(id=instance_user.id)
            if username_qs.exists():
                raise serializers.ValidationError({"username": "Este nome de usuário já está em uso."})

        if 'email' in user_data:
            if not email:
                raise serializers.ValidationError({"email": "O email não pode ficar vazio."})
            email_qs = User.objects.filter(email=email)
            if instance_user:
                email_qs = email_qs.exclude(id=instance_user.id)
            if email_qs.exists():
                raise serializers.ValidationError({"email": "Este email já está cadastrado."})

        if password or password_confirm:
            if password != password_confirm:
                raise serializers.ValidationError({"password": "As senhas não coincidem."})

        matricula_in_payload = 'matricula' in attrs
        matricula = (attrs.get('matricula') or '').strip() if matricula_in_payload else (getattr(self.instance, 'matricula', None) or '')
        if matricula_in_payload or not (getattr(self.instance, 'matricula', None) or '').strip():
            if not matricula:
                raise serializers.ValidationError({"matricula": "Matrícula é obrigatória."})
            attrs['matricula'] = matricula
            _validate_matricula_unique(matricula, self.instance)

        if 'username' in user_data:
            user_data['username'] = username
        if 'email' in user_data:
            user_data['email'] = email
        attrs['user'] = user_data
        attrs['role'] = AdministratorRole.SUPER_ADMIN
        return attrs

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {}) or {}

        password = (validated_data.pop('password', '') or '').strip()
        validated_data.pop('password_confirm', None)

        validated_data['role'] = AdministratorRole.SUPER_ADMIN

        user = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)

        if password:
            user.set_password(password)

        user.is_staff = True
        user.is_superuser = True
        user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
