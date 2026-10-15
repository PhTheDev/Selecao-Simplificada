# administrator/urls.py
from django.urls import path, include # type: ignore
from rest_framework import routers # type: ignore
from .views import AdministratorViewSet

router = routers.DefaultRouter()
router.register(r'administrators', AdministratorViewSet)

urlpatterns = [
    path('', include(router.urls)),
]