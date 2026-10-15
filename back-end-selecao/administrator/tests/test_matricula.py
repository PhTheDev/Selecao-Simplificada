import pytest
from django.contrib.auth.models import User

from administrator.models import AdministratorProfile
from administrator.serializers import AdministratorRegisterSerializer, AdministratorUpdateSerializer


@pytest.fixture
def admin_profile(db):
    user = User.objects.create_user(
        username="admin1",
        email="admin1@example.com",
        password="Admin123!@#",
        first_name="Admin",
        last_name="Um",
    )
    return AdministratorProfile.objects.create(
        user=user,
        role="super_admin",
        is_active=True,
        matricula="133755",
    )


@pytest.mark.django_db
def test_register_requires_matricula():
    serializer = AdministratorRegisterSerializer(data={
        "username": "novo_admin",
        "email": "novo@example.com",
        "password": "Admin123!@#",
        "password_confirm": "Admin123!@#",
        "first_name": "Novo",
        "last_name": "Admin",
        "department": "TI",
    })
    assert not serializer.is_valid()
    assert "matricula" in serializer.errors


@pytest.mark.django_db
def test_register_rejects_invalid_matricula():
    serializer = AdministratorRegisterSerializer(data={
        "username": "novo_admin",
        "email": "novo@example.com",
        "password": "Admin123!@#",
        "password_confirm": "Admin123!@#",
        "first_name": "Novo",
        "last_name": "Admin",
        "matricula": "ABC123",
    })
    assert not serializer.is_valid()
    assert "matricula" in serializer.errors


@pytest.mark.django_db
def test_register_enforces_unique_matricula(admin_profile):
    serializer = AdministratorRegisterSerializer(data={
        "username": "outro_admin",
        "email": "outro@example.com",
        "password": "Admin123!@#",
        "password_confirm": "Admin123!@#",
        "first_name": "Outro",
        "last_name": "Admin",
        "matricula": "133755",
    })
    assert not serializer.is_valid()
    assert "matricula" in serializer.errors


@pytest.mark.django_db
def test_update_requires_matricula_when_missing(admin_profile):
    admin_profile.matricula = None
    admin_profile.save(update_fields=["matricula"])

    serializer = AdministratorUpdateSerializer(
        instance=admin_profile,
        data={"username": admin_profile.user.username},
        partial=True,
    )
    assert not serializer.is_valid()
    assert "matricula" in serializer.errors
