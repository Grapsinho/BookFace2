from django.urls import path
from .views import *

urlpatterns = [
    path('', home, name='home'),
    path('profile/<str:email>', ProfileView.as_view(), name='profile'),
]