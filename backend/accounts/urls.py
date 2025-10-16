from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views


router = DefaultRouter()
router.register('users', views.UserViewSet)
router.register('keys', views.UserKeyViewSet)

urlpatterns = [
    path('activate/', views.UserActivationViewSet.as_view(), name='activate'),
    path('resend-email/', views.ResendActivationEmailViewSet.as_view(), name='resend_email'),
    path('jwt/create/', views.CreateJWT.as_view(), name='jwt-create'),
    path('jwt/refresh/', views.RefreshJWT.as_view(), name='jwt-refresh'),
    path('jwt/expire/', views.ExpireJWT.as_view(), name='jwt-expire'),
] + router.urls
