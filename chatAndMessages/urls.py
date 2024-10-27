from django.urls import path
from .views import *

urlpatterns = [
    path('<str:friend_email>/fetch_chat_for_user/', RetrieveChat.as_view(), name='RetrieveChat'),
]