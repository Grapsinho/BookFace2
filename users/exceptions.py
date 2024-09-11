from rest_framework.exceptions import APIException

class AuthenticationRedirectException(APIException):
    status_code = 403  # Forbidden status code
    default_detail = 'Authentication credentials were not provided or are invalid.'
    default_code = 'authentication_failed'

from rest_framework.throttling import UserRateThrottle

class LoginRateThrottle(UserRateThrottle):
    rate = '5/minute'