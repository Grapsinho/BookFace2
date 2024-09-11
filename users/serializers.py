from rest_framework import serializers
from .models import User
from rest_framework.validators import ValidationError
from rest_framework.authtoken.models import Token

class UserSerializer(serializers.ModelSerializer):
    # Define serializer fields for email, username, and password
    email = serializers.CharField(max_length=80)
    password = serializers.CharField(min_length=8, write_only=True)  # Password won't be included in serialized output
    first_name = serializers.CharField(max_length=255)
    last_name = serializers.CharField(max_length=255)

    gender = serializers.CharField(max_length=10)

    # Birth date fields
    birth_day = serializers.IntegerField()
    birth_month = serializers.CharField(max_length=30)
    birth_year = serializers.IntegerField()

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name", "gender", "birth_day", 'birth_month', 'birth_year']

    # Validate method to check if the email already exists in the database
    def validate(self, attrs):
        email_exist = User.objects.filter(email=attrs["email"]).exists()
        if email_exist:
            raise ValidationError("Email has already been used")  # Raise an error if the email is already in use
        return super().validate(attrs)

    # Create method to handle the creation of a new user
    def create(self, validated_data):
        password = validated_data.pop("password")  # Extract the password from validated data
        user = super().create(validated_data)  # Create a new user instance
        user.set_password(password)  # Set the user's password using set_password for encryption

        user.save()  # Save the user instance with the updated password
        return user  # Return the created user instance