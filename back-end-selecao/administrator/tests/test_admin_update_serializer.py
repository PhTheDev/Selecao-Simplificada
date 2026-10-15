import pytest
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from administrator.models import AdministratorProfile
from administrator.serializers import AdministratorUpdateSerializer


@pytest.fixture
def admin_profile(db):
    user = User.objects.create_user(
        username="admin1",
        email="admin1@example.com",
        password="Admin123!@#",
        first_name="Admin",
        last_name="Um",
    )
    return AdministratorProfile.objects.create(user=user, role="super_admin", is_active=True, matricula="133755")


@pytest.fixture
def another_user(db):
    return User.objects.create_user(
        username="admin2",
        email="admin2@example.com",
        password="Admin123!@#",
    )


@pytest.mark.django_db
def test_update_serializer_updates_username_and_email(admin_profile):
    serializer = AdministratorUpdateSerializer(
        instance=admin_profile,
        data={"username": "admin_atualizado", "email": "novo_email@example.com"},
        partial=True,
    )
    assert serializer.is_valid(), serializer.errors

    serializer.save()
    admin_profile.refresh_from_db()
    assert admin_profile.user.username == "admin_atualizado"
    assert admin_profile.user.email == "novo_email@example.com"


@pytest.mark.django_db
def test_update_serializer_blocks_duplicate_username(admin_profile, another_user):
    serializer = AdministratorUpdateSerializer(
        instance=admin_profile,
        data={"username": another_user.username},
        partial=True,
    )

    assert not serializer.is_valid()
    assert "username" in serializer.errors


@pytest.mark.django_db
def test_update_serializer_rejects_blank_username(admin_profile):
    serializer = AdministratorUpdateSerializer(
        instance=admin_profile,
        data={"username": "   "},
        partial=True,
    )

    assert not serializer.is_valid()
    assert "username" in serializer.errors


@pytest.mark.django_db
def test_update_serializer_rejects_password_when_confirmation_differs(admin_profile):
    serializer = AdministratorUpdateSerializer(
        instance=admin_profile,
        data={"password": "Admin123!@#", "password_confirm": "OutraSenha123!"},
        partial=True,
    )

    assert not serializer.is_valid()
    assert "password" in serializer.errors


@pytest.mark.django_db
def test_update_serializer_changes_password_and_allows_authentication(admin_profile):
    new_password = "NovaSenhaForte!2026"
    serializer = AdministratorUpdateSerializer(
        instance=admin_profile,
        data={"password": new_password, "password_confirm": new_password},
        partial=True,
    )
    assert serializer.is_valid(), serializer.errors

    serializer.save()
    admin_profile.refresh_from_db()

    authenticated = authenticate(username=admin_profile.user.username, password=new_password)
    assert authenticated is not None
