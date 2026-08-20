# Add these environment variables to your .env.local file:

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...  # Your Stripe webhook secret (for local: use Stripe CLI endpoint secret)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Change to your production URL

## 🧪 Testing Webhooks Locally with Stripe CLI

### 1. Install Stripe CLI
Download from: https://stripe.com/docs/stripe-cli
Or install with package manager:
```bash
# Windows (with Chocolatey)
choco install stripe-cli

# macOS (with Homebrew)
brew install stripe/stripe-cli/stripe

# Or download directly from GitHub releases
```

### 2. Login to Stripe CLI
```bash
stripe login
```

### 3. Forward webhooks to your local server
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

This will give you a webhook endpoint secret like: `whsec_...`
**Copy this secret to your .env.local as STRIPE_WEBHOOK_SECRET**

### 4. Test payments
```bash
# Trigger a test checkout.session.completed event
stripe trigger checkout.session.completed

# Or create a real test payment and complete it in Stripe dashboard
```

### 5. Monitor webhook events
The Stripe CLI will show you all webhook events in real-time:
```
2024-10-02 10:30:15   --> checkout.session.completed [evt_1234...]
2024-10-02 10:30:15  <--  [200] POST http://localhost:3000/api/payments/webhook
```

## 📋 Production Setup (Later)

# How to get production values:
# 1. Go to https://dashboard.stripe.com/
# 2. Create a new account or log in
# 3. Get your API keys from the Developers section
# 4. Create a webhook endpoint pointing to your-domain.com/api/payments/webhook
# 5. Select these events for your webhook:
#    - checkout.session.completed
#    - checkout.session.expired  
#    - payment_intent.payment_failed
# 6. Copy the webhook signing secret