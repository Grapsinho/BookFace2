from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.models import User
from .models import FriendRequest, Friendship
from users.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from users.exceptions import AuthenticationRedirectException
from notifications.models import Notification
from django.db.models import Q
from .tasks import notify_user_on_friend_request, handle_friend_request_response

class SendFriendRequestView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        sender = request.user
        receiver_id = request.data.get('receiver_id')

        # Ensure the receiver ID is provided
        if not receiver_id:
            return Response({"detail": "Receiver ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get the receiver user
            receiver = User.objects.get(id=receiver_id)
            
            # Ensure sender isn't sending a request to themselves
            if sender == receiver:
                return Response({"detail": "You cannot send a friend request to yourself."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if the request already exists (pending, accepted, or rejected)
            if FriendRequest.objects.filter(sender=sender, receiver=receiver).exists():
                return Response({"detail": "Friend request already sent."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if they are already friends (optional, based on your Friendship model)
            if sender.user_friendships.filter(friend=receiver).exists():
                return Response({"detail": "You are already friends with this user."}, status=status.HTTP_400_BAD_REQUEST)

            # Create the friend request
            friend_request = FriendRequest.objects.create(sender=sender, receiver=receiver)

            notify_user_on_friend_request.delay(friend_request.pk)

            return Response({"message": "Friend request sent."}, status=status.HTTP_201_CREATED)

        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        
class RejectFriendRequestView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        receiver = request.user
        sender_id = request.data.get('sender_id')
        notification_id = request.data.get('notification_id')

        # Ensure the sender ID is provided
        if not sender_id:
            return Response({"detail": "Sender ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sender = User.objects.get(id=sender_id)

            # Retrieve the friend request
            friend_request = FriendRequest.objects.filter(sender=sender, receiver=receiver, accepted=False, rejected=False).first()
            if not friend_request:
                return Response({"detail": "No pending friend request found."}, status=status.HTTP_404_NOT_FOUND)
            
            # Mark as rejected
            friend_request.rejected = True
            friend_request.save()

            notification = Notification.objects.get(id=notification_id)

            handle_friend_request_response.delay(friend_request.pk, accepted=False)

            notification.delete()

            return Response({"message": "Friend request rejected."}, status=status.HTTP_200_OK)

        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)

class AcceptFriendRequestView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        receiver = request.user
        sender_id = request.data.get('sender_id')
        notification_id = request.data.get('notification_id')

        # Ensure the sender ID is provided
        if not sender_id:
            return Response({"detail": "Sender ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sender = User.objects.get(id=sender_id)
            
            # Retrieve the friend request
            friend_request = FriendRequest.objects.filter(sender=sender, receiver=receiver, accepted=False, rejected=False).first()
            if not friend_request:
                return Response({"detail": "No pending friend request found."}, status=status.HTTP_404_NOT_FOUND)
            
            # Mark as accepted
            friend_request.accepted = True
            friend_request.save()

            Friendship.create_friendship(sender, receiver)

            notification = Notification.objects.get(id=notification_id)

            handle_friend_request_response.delay(friend_request.pk, accepted=True)

            notification.delete()

            return Response({"message": "Friend request accepted."}, status=status.HTTP_200_OK)

        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)
        
class RemoveFriendRequestView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        current_user = request.user
        user_for_unfriend_id = request.data.get('unfriend_friend_id')

        # Ensure the sender ID is provided
        if not user_for_unfriend_id:
            return Response({"detail": "User ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_for_unfriend = User.objects.get(id=user_for_unfriend_id)

            Friendship.objects.filter(
                Q(user=current_user, friend=user_for_unfriend) | 
                Q(user=user_for_unfriend, friend=current_user)
            ).delete()

            # Create an unfriend notification after the friendship is removed
            notification = Notification.objects.create(
                recipient=user_for_unfriend,
                sender=current_user,
                message=f"Has removed you as a friend.",
                notification_type='unfriend'
            )

            return Response({"message": "Friend successfully removed."}, status=status.HTTP_200_OK)

        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)

class DeleteNotifications(APIView):
    def post(self, request, *args, **kwargs):
        req_id = request.data.get('notification_id')

        try:
            notification_model = Notification.objects.get(pk=req_id).delete()
            return Response({"message": "notification successfully removed."}, status=status.HTTP_200_OK)
        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)