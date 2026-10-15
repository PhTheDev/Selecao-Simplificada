"""
Permission classes customizadas para seguir o princípio SRP.
Centraliza toda lógica de permissão em um único lugar.
"""
from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permite leitura para todos, mas escrita apenas para administradores.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.is_staff


class IsAdminOnly(permissions.BasePermission):
    """
    Permite acesso apenas para administradores.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permite acesso se o usuário é o dono do recurso ou é administrador.
    """
    def has_object_permission(self, request, view, obj):
        # Administradores têm acesso total
        if request.user.is_staff:
            return True
        
        # Verifica se o usuário é o dono do recurso
        if hasattr(obj, 'candidate') and hasattr(obj.candidate, 'user'):
            return obj.candidate.user == request.user
        
        return False

