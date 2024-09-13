#Third-Party Library Imports:
import bleach
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError


#Django Core Imports:
from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib.auth import authenticate, login, logout
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.contrib.auth.views import PasswordResetView


#Django REST Framework Imports:
from rest_framework import generics, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import Throttled


#Custom App-Specific Imports:
from .serializers import UserSerializer
from .tokens import create_jwt_for_user
from .exceptions import LoginRateThrottle
from .authentication import JWTAuthentication
from .exceptions import AuthenticationRedirectException
from .forms import CustomPasswordResetForm


def sanitize_input(user_input):
    cleaned_input = bleach.clean(user_input, tags=['p', 'strong', 'em'], attributes={'*': ['class']})
    return cleaned_input

############################ es yvelaferi aqedan ############################################
def registration(request):
    return render(request, 'users/register.html')

def loginView(request):
    return render(request, 'users/login.html')

class SignUpView(generics.GenericAPIView):

    """
    View for user registration.
    """

    serializer_class = UserSerializer
    permission_classes = []

    def post(self, request: Request):
        data = request.data
        serializer = self.serializer_class(data=data)

        if serializer.is_valid():
            user = serializer.save()
            if user.gender == 'female':
                user.avatar = 'avatars/default-girl-avatar.jpg'
                user.save()

            response = {"message": "User Created", "data": serializer.data}

            return Response(data=response, status=status.HTTP_201_CREATED)

        return Response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ანუ რო მოგივივა მესიჯი ჯავასცრიპტზე რო არარის იუზერი დარეგისტრირებული დავარედირექტებთ ლოგინ ფეიჯზე ჯავასკრიპტით
class UserProfileView(APIView):
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        try:
            # If authentication fails, an exception will be raised
            user = request.user
            profile_data = {
                "username": user.full_birth_date,
                "email": user.email,
                # Add other profile details here
            }

            return Response({"message": "User profile retrieved", "profile": profile_data})

        except AuthenticationRedirectException as e:
            return Response({"detail": str(e)}, status=401)

class LoginView(APIView):
    """
    View for user login and JWT token generation.
    """

    throttle_classes = [LoginRateThrottle]

    def post(self, request: Request):
        email = sanitize_input(request.data.get("email"))
        password = sanitize_input(request.data.get('password')) 

        try:
            validate_email(email)
        except ValidationError:
            return Response({"message": "Invalid email format"}, status=status.HTTP_400_BAD_REQUEST)


        user = authenticate(request, password=password, email=email)

        if user is not None:
            login(request, user)
            # When the user logs in, create tokens
            tokens = create_jwt_for_user(user)
            
            if user.setup_profile:
                # Create response with JWT tokens in cookies
                response_data = {
                    "message": "User login successful",
                }
            else:
                # Create response with JWT tokens in cookies
                response_data = {
                    "message": "User login successful",
                    "redirect_url": reverse('profile_setup')  # URL for redirection after login
                }

            response = Response(response_data, status=status.HTTP_200_OK)

            # Set the JWT tokens as HTTP-only cookies
            response.set_cookie(
                key='access_token',
                value=tokens['access'],
                httponly=True,
                secure=True,
                samesite='Lax',
                path='/'
            )
            response.set_cookie(
                key='refresh_token',
                value=tokens['refresh'],
                httponly=True,
                secure=True,
                samesite='Lax',
                path='/'
            )

            return response
        else:
            return Response(
                data={"message": "Email or password is invalid"},
            )
    
    def handle_exception(self, exc):
        # Custom handling for Throttled exception
        if isinstance(exc, Throttled):
            custom_response_data = {
                "message": "You have made too many login attempts. Please try again later.",
                "available_in": f"{exc.wait} seconds"
            }
            return Response(custom_response_data, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Handle other exceptions as usual
        return super().handle_exception(exc)

def logoutForm(request):
    response = redirect('login')

    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')

    logout(request)
    return response

# es mchirdeboda imito ro invalidacia gamomeyenebina roca user chawerda araswor emails
class CustomPasswordResetView(PasswordResetView):
    form_class = CustomPasswordResetForm

    def form_valid(self, form):
        response = super().form_valid(form)
        # You can add additional success handling here
        return response

    def form_invalid(self, form):
        return self.render_to_response(self.get_context_data(form=form))
    
class RefreshAccessTokenView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response({"message": "Refresh token missing"}, status=400)

        try:
            # Create RefreshToken object from the refresh_token
            refresh = RefreshToken(refresh_token)
            
            # Generate a new access token
            new_access_token = refresh.access_token

            # Prepare the response with the new access token in a secure cookie
            response = Response({"message": "New access token generated"}, status=200)
            response.set_cookie(
                key='access_token',
                value=str(new_access_token),
                httponly=True,
                secure=True,
                samesite='Lax',
                path='/'
            )
            return response

        except TokenError as e:
            return Response({"message": 'logout qeni'}, status=400)

        except Exception as e:
            return Response({"message": "An error occurred: " + str(e)}, status=400)

####################### aqamde aris registracia logini an parolis shecvlistvis ############################