from rest_framework.throttling import ScopedRateThrottle


class LoginRateThrottle(ScopedRateThrottle):
    scope = "login"


class SmsResetRateThrottle(ScopedRateThrottle):
    scope = "sms_reset"

