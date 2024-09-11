from rest_framework.authentication import BaseAuthentication
from rest_framework_simplejwt.tokens import AccessToken
from .exceptions import AuthenticationRedirectException
from .models import User
from django.shortcuts import redirect

class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        access_token = request.COOKIES.get('access_token')

        if not access_token:
        # Raise custom exception if token is not present
            raise AuthenticationRedirectException()

        try:
            validated_token = AccessToken(access_token)
            user = User.objects.get(id=validated_token['user_id'])
        except Exception:
            # Raise custom exception if token is invalid or expired
            raise AuthenticationRedirectException()

        return (user, None)