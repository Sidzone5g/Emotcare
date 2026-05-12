# Superprofile to Supabase Setup

## Deploy backend on Render

Use these Render settings:

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Add these environment variables in Render:

```text
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ADMIN_UPDATE_TOKEN=choose_a_long_random_secret
ALLOWED_ORIGINS=https://your-netlify-site.netlify.app
```

After deploy, test:

```text
https://your-render-backend.onrender.com/api/health
```

Expected response:

```json
{ "status": "ok" }
```

## Connect Zapier

Create a Zap:

```text
Trigger: SuperProfile - New Purchase
Action: Webhooks by Zapier - Custom Request
```

Webhook action:

```text
Method: PATCH
URL: https://your-render-backend.onrender.com/api/profiles/subscription-by-email
Payload Type: JSON
```

Headers:

```json
{
  "Authorization": "Bearer YOUR_ADMIN_UPDATE_TOKEN",
  "Content-Type": "application/json"
}
```

Body:

```json
{
  "email": "{{buyer_email}}",
  "planName": "{{product_name}}",
  "status": "active"
}
```

The buyer email must match the email in the Supabase `profiles` row.

## Accepted plan names

```text
TRIAL RECOVERY
RECOVERY
STUDENT RECOVERY
CAREER COUNSELLING
```

The backend also accepts these short aliases:

```text
TRIAL
STUDENT
CAREER
```
