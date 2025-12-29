# Payment Gateway Setup

This document explains how to configure payment gateways for the Radium application.

## Cashfree Payment Gateway

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Cashfree Payment Gateway Settings
CASHFREE_APP_ID=your_cashfree_app_id_here
CASHFREE_SECRET_KEY=your_cashfree_secret_key_here
CASHFREE_ENVIRONMENT=TEST  # or PRODUCTION for live environment
CASHFREE_WEBHOOK_SECRET=your_webhook_secret_here
CASHFREE_RETURN_URL=http://127.0.0.1:8000/api/payment/cashfree/success/
CASHFREE_NOTIFY_URL=http://127.0.0.1:8000/api/payment/webhook/
```

### Getting Cashfree Credentials

1. Sign up at [Cashfree Dashboard](https://merchant.cashfree.com/)
2. Navigate to Developers > API Keys
3. Copy your App ID and Secret Key
4. For webhook secret, you can generate a random string or use the one provided by Cashfree

### Environment Settings

- **TEST/SANDBOX**: Use for development and testing
- **PRODUCTION/PROD/LIVE**: Use for production environment

### Test Credentials

For testing purposes, you can use test credentials provided by Cashfree. Contact Cashfree support or check their documentation for current test credentials.

Example format:
```env
CASHFREE_APP_ID=TEST_your_test_app_id_here
CASHFREE_SECRET_KEY=cfsk_ma_test_your_test_secret_key_here
CASHFREE_ENVIRONMENT=TEST
```

**Note**: Never commit real production credentials to version control!

## PayU Payment Gateway

### Environment Variables

```env
# PayU Payment Gateway Settings
PAYU_MERCHANT_KEY=your_payu_merchant_key
PAYU_MERCHANT_SALT=your_payu_merchant_salt
PAYU_BASE_URL=https://test.payu.in  # or https://secure.payu.in for production
PAYU_ENVIRONMENT=TEST  # or PRODUCTION
PAYU_SUCCESS_URL=http://127.0.0.1:8000/api/payment/payu/success/
PAYU_FAILURE_URL=http://127.0.0.1:8000/api/payment/payu/failure/
```

## Security Best Practices

1. **Never commit credentials to version control**
2. **Use different credentials for development and production**
3. **Regularly rotate your API keys**
4. **Use environment variables for all sensitive configuration**
5. **Validate webhook signatures to ensure authenticity**

## Troubleshooting

### Common Issues

1. **"Cashfree credentials not configured" error**
   - Ensure CASHFREE_APP_ID and CASHFREE_SECRET_KEY are set in your .env file
   - Check that the .env file is in the correct location (radiumB/.env)

2. **Payment creation fails**
   - Verify your credentials are correct
   - Check if you're using the right environment (TEST vs PRODUCTION)
   - Ensure your webhook URLs are accessible

3. **Webhook verification fails**
   - Make sure CASHFREE_WEBHOOK_SECRET matches the one in your Cashfree dashboard
   - Check that your webhook endpoint is properly configured

### Debug Mode

In development, set `DEBUG=True` in your .env file to see detailed configuration information when the server starts.