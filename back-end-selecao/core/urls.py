"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin # type: ignore
from django.urls import path # type: ignore
from django.urls import include # type: ignore
from django.urls import re_path # type: ignore
from django.conf import settings # type: ignore
from django.conf.urls.static import static # type: ignore
from drf_spectacular.views import ( # type: ignore
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

from .media_views import protected_media

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('api/administration/', include('administrator.urls')),
    path('api/selection/', include('selection.urls')),
    path('api/integration/', include('integration.urls')),
    # Schema JSON
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # Interface Swagger
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Interface Redoc
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    # Media com ACL seletiva (banners/editais públicos; docs de candidato autenticados)
    re_path(r"^media/(?P<path>.*)$", protected_media, name="protected-media"),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
