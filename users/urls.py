from django.urls import path, include
from .views import *
from django.contrib.auth import views as auth_views

urlpatterns = [
    # views that handles registration and authorization
    path("signup/", SignUpView.as_view(), name="signup"),
    path("signin/", LoginView.as_view(), name="signin"),

    # just template views
    path('registration/', registration, name='registration'),
    path('login/', loginView, name='login'),
    path('logout/', logoutForm, name='logout'),
    path('UserProfileView/', UserProfileView.as_view(), name='UserProfileView'),

    # ეს არის ლინკი სადაც უნდა შევიყვანოთ ჩვენი იმეილი რათა მოხდეს იმეილის გაგზავნა
    path('password_reset/', CustomPasswordResetView.as_view(template_name="users/forget-password.html"), name='password_reset'),
    # აქ უკვე გამოჩნდება მესიჯი სადაც ეწერება რომ იმეილი გაიგზავნა
    path('password_reset/done/', auth_views.PasswordResetDoneView.as_view(template_name="users/check-email.html"), name='password_reset_done'),
    # აქ ვაკეთებთ პაროლის შეცვლას
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(template_name="users/change-password.html"), name='password_reset_confirm'),
    # და ეს უკვე არის დასასრული და მერე გადავდივართ ლოგინ ფეიჯზე ისევ
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(template_name="users/password-reset-done.html"), name='password_reset_complete'),

    # refresh JWT token
    path('token/refresh/', RefreshAccessTokenView.as_view(), name='RefreshAccessToken'),
]