from users.exceptions import AuthenticationRedirectException
from users.authentication import JWTAuthentication
from rest_framework.generics import ListAPIView
from .models import Notification
from .serializers import NotificationSerializer
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class UserNotificationsView(ListAPIView):
    serializer_class = NotificationSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return notifications for the authenticated user, applying limit and offset for loading more.
        """
        limit = int(self.request.query_params.get('limit', 7))  # Default limit is 7
        offset = int(self.request.query_params.get('offset', 0))  # Default offset is 0

        return Notification.objects.filter(
            recipient=self.request.user
        ).values('id', 'sender__first_name', 'sender__last_name', 'notification_type', 'recipient__first_name', 'recipient__last_name', 'sender__email', 'sender__avatar', 'sender__id').order_by('-timestamp')[offset:offset + limit]

    def list(self, request, *args, **kwargs):
        """
        Overriding list method to return total count of notifications alongside data.
        """
        try:
            queryset = self.get_queryset()
            total_notifications = Notification.objects.filter(recipient=self.request.user).count()

            serializer = self.get_serializer(queryset, many=True)

            return Response({
                'notifications': serializer.data,
                'total_count': total_notifications, # Send the total count of notifications
                'detail': 'notifications sent',
            })

        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)