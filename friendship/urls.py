from django.urls import path
from .views import *

urlpatterns = [
    path('sendFriendRequest/', SendFriendRequestView.as_view(), name='sendFriendRequest'),
    path('RejectFriendRequestView/', RejectFriendRequestView.as_view(), name='RejectFriendRequestView'),
    path('AcceptFriendRequestView/', AcceptFriendRequestView.as_view(), name='AcceptFriendRequestView'),
    path('RemoveFriendRequestView/', RemoveFriendRequestView.as_view(), name='RemoveFriendRequestView'),
    path('DeleteNotifications/', DeleteNotifications.as_view(), name='DeleteNotifications'),
]