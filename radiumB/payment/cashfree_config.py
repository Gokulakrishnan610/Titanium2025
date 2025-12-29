import os
from cashfree_pg.api_client import Cashfree
from django.conf import settings

# Get Cashfree configuration from Django settings
cashfree_config = getattr(settings, 'CASHFREE_CONFIG', {})

# Set Cashfree client configuration using environment variables
Cashfree.XClientId = cashfree_config.get('APP_ID', os.getenv('CASHFREE_APP_ID'))
Cashfree.XClientSecret = cashfree_config.get('SECRET_KEY', os.getenv('CASHFREE_SECRET_KEY'))

# Validate that required credentials are set
if not Cashfree.XClientId or not Cashfree.XClientSecret:
    raise ValueError(
        "Cashfree credentials not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY environment variables."
    )

# Set environment (SANDBOX or PRODUCTION)
environment = cashfree_config.get('ENVIRONMENT', os.getenv('CASHFREE_ENVIRONMENT', 'TEST'))
if environment.upper() in ['PRODUCTION', 'PROD', 'LIVE']:
    Cashfree.XEnvironment = Cashfree.PRODUCTION
else:
    Cashfree.XEnvironment = Cashfree.SANDBOX

# Debug information (only in development)
if os.getenv('DEBUG', 'False').lower() == 'true':
    print("Cashfree Configuration:")
    print(f"  Client ID: {Cashfree.XClientId}")
    print(f"  Client Secret: {'*' * len(Cashfree.XClientSecret) if Cashfree.XClientSecret else None}")
    print(f"  Environment: {environment} ({'PRODUCTION' if Cashfree.XEnvironment == Cashfree.PRODUCTION else 'SANDBOX'})")
