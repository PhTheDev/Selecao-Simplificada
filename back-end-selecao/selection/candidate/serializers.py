from rest_framework import serializers  # type: ignore
from django.contrib.auth.hashers import make_password, check_password  # type: ignore

from .models import Candidate, EmailVerification


class CandidateSerializer(serializers.ModelSerializer):
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = [
            'id', 'name', 'email', 'email_verified', 'cpf', 'gender', 'phone',
            'college', 'period', 'semester', 'cep', 'address', 'complement',
            'neighborhood', 'city', 'uf',
            'profile_image', 'profile_image_url', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'email', 'email_verified', 'is_active', 'created_at']

    def get_profile_image_url(self, obj):
        if obj.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return None


class CandidateRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = Candidate
        fields = ['name', 'email', 'password', 'password_confirm']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password": "As senhas não coincidem."})

        if Candidate.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Este email já está cadastrado."})

        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        validated_data['password'] = make_password(validated_data['password'])

        candidate = Candidate.objects.create(
            **validated_data,
            email_verified=False,
            is_active=True
        )
        return candidate


class CandidateLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        try:
            candidate = Candidate.objects.get(email=email)
        except Candidate.DoesNotExist:
            raise serializers.ValidationError("Email ou senha inválidos.")

        if not check_password(password, candidate.password or ''):
            raise serializers.ValidationError("Email ou senha inválidos.")

        if not candidate.email_verified:
            raise serializers.ValidationError(
                "Por favor, verifique seu email antes de fazer login. "
                "Um email de confirmação foi enviado para seu endereço."
            )

        if not candidate.is_active:
            raise serializers.ValidationError("Esta conta está desativada.")

        if not candidate.user:
            candidate.create_user_account()

        data['candidate'] = candidate
        data['user'] = candidate.user
        return data


# ===========================
# 🔐 Password Reset
# ===========================

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    password = serializers.CharField(min_length=6, write_only=True)
    password_confirm = serializers.CharField(min_length=6, write_only=True)

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({"password": "As senhas não coincidem."})
        return data


class PasswordResetSmsRequestSerializer(serializers.Serializer):
    phone = serializers.CharField(required=True, allow_blank=True, max_length=20)


class PasswordResetSmsVerifySerializer(serializers.Serializer):
    verification_id = serializers.CharField(required=True, max_length=64)
    code = serializers.CharField(required=True, allow_blank=True, max_length=12)
