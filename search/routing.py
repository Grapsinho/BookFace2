from django.urls import path
from .consumers import SearchConsumer

websocket_urlpatterns = [
    path('ws/search_friends/', SearchConsumer.as_asgi()),
]