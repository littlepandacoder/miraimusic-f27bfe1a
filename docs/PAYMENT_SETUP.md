# Payment Setup (Stripe)

This project includes a lightweight server endpoint to create Stripe Checkout sessions and a webhook handler that can create Supabase users when payment completes.

Important env variables (set these in `server/.env.local`, do NOT commit):

- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_...`).
- `STRIPE_WEBHOOK_SECRET` - The webhook signing secret for your endpoint.
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (admin) used to create users programmatically.
- `SUPABASE_URL` - Your Supabase project URL (already in `.env.local`).
- `FRONTEND_URL` - Public URL of the frontend used for checkout redirects (e.g. `https://app.example.com`).

How it works

1. Frontend calls `POST /create-checkout-session` on the server with `{ email }`.
2. Server creates a Stripe Checkout Session (recurring monthly $29 by default) and returns the session URL.
3. User completes payment in Stripe.
4. Stripe calls your configured webhook URL (`/stripe-webhook`) on the server.
5. Server validates the webhook signature and, if `checkout.session.completed`, uses the Supabase Service Role Key to create a Supabase user for the paid email and generates a simple password.

Security notes

- You must provide `SUPABASE_SERVICE_ROLE_KEY` for the server to create users. Keep it secret and only on the server.
- The password generation in `server/index.cjs` uses a simple deterministic approach for demo purposes. Consider using a secure random password generator and emailing the user a reset link or sending a secure onboarding email.

Setup steps

1. Add the env variables to `server/.env.local` from the `server/.env.example` template.
2. Install dependencies and start the server:

```bash
npm install
npm run dev:server
```

3. In Stripe dashboard, create a Checkout webhook endpoint pointing to `https://<your-server>/stripe-webhook` and copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Test the flow using Stripe test cards.

Manual testing (local)

When running locally, you can use `stripe CLI` to forward webhooks:

```bash
stripe listen --forward-to localhost:3001/stripe-webhook
```

Then click Subscribe on the index page, complete a test payment, and verify that a new user is created in Supabase.

Next steps / Improvements

- Send an onboarding email with a secure link to set a password instead of storing/generating one.
- Use Stripe Products & Prices instead of inline price_data to manage billing in the Stripe dashboard.
- Add unit and integration tests for webhook handling and user creation.
