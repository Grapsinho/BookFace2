from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Chat
from users.models import User
import bleach
from django.shortcuts import get_object_or_404
from .serializers import MessageSerializer
from rest_framework.authentication import SessionAuthentication


# Create your views here.

def sanitize_input(user_input):
    cleaned_input = bleach.clean(user_input, tags=['p', 'strong', 'em'], attributes={'*': ['class']})
    return cleaned_input

class RetrieveChat(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]

    
    def get(self, request, friend_email):
        try: 
            user = request.user
            friend = get_object_or_404(User, email=sanitize_input(friend_email))

            chat = Chat.get_conversation(user, friend)

            if chat:
                messages = chat.messages.only('sender__email', 'receiver__email', 'content', 'timestamp', 'id')

                serialized_messages = MessageSerializer(messages, many=True).data

                return Response({"messages": serialized_messages}, status=status.HTTP_200_OK)
            else:
                return Response({"start_con": f"Start Conversation With {friend.first_name}"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"user_not_found": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except:
            return Response({"other_errors": "errors"}, status=status.HTTP_400_BAD_REQUEST)