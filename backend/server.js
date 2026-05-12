require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

const requiredEnv = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_UPDATE_TOKEN'
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  }
}));

app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PLAN_DURATIONS = {
  'TRIAL RECOVERY': 7,
  'RECOVERY': 28,
  'STUDENT RECOVERY': 30,
  'CAREER COUNSELLING': 30
};

const PLAN_ALIASES = {
  'TRIAL RECOVERY': 'TRIAL RECOVERY',
  'RECOVERY': 'RECOVERY',
  'STUDENT RECOVERY': 'STUDENT RECOVERY',
  'CAREER COUNSELLING': 'CAREER COUNSELLING',
  'TRIAL': 'TRIAL RECOVERY',
  'STUDENT': 'STUDENT RECOVERY',
  'CAREER': 'CAREER COUNSELLING'
};

function requireAdminToken(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_UPDATE_TOKEN}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  return true;
}

function normalizePlanName(planName) {
  const normalized = String(planName || '').trim().toUpperCase();
  return PLAN_ALIASES[normalized] || normalized;
}

function getPeriodEnd(planName, providedPeriodEnd) {
  if (providedPeriodEnd) {
    const date = new Date(providedPeriodEnd);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  const days = PLAN_DURATIONS[planName];
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.patch('/api/profiles/:userId/subscription', async (req, res) => {
  try {
    if (!requireAdminToken(req, res)) return;

    const { userId } = req.params;
    const { planName, currentPeriodEnd, status = 'active' } = req.body;
    const normalizedPlanName = normalizePlanName(planName);

    if (!userId || !normalizedPlanName) {
      return res.status(400).json({ error: 'Missing userId or planName' });
    }

    if (!PLAN_DURATIONS[normalizedPlanName]) {
      return res.status(400).json({ error: 'Invalid planName' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        plan_purchased: normalizedPlanName,
        current_period_end: getPeriodEnd(normalizedPlanName, currentPeriodEnd),
        subscription_status: status
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ profile: data });
  } catch (error) {
    console.error('Subscription update error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.patch('/api/profiles/subscription-by-email', async (req, res) => {
  try {
    if (!requireAdminToken(req, res)) return;

    const { email, planName, currentPeriodEnd, status = 'active' } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPlanName = normalizePlanName(planName);

    if (!normalizedEmail || !normalizedPlanName) {
      return res.status(400).json({ error: 'Missing email or planName' });
    }

    if (!PLAN_DURATIONS[normalizedPlanName]) {
      return res.status(400).json({ error: 'Invalid planName' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        plan_purchased: normalizedPlanName,
        current_period_end: getPeriodEnd(normalizedPlanName, currentPeriodEnd),
        subscription_status: status
      })
      .ilike('email', normalizedEmail)
      .select()
      .single();

    if (error) throw error;

    res.json({ profile: data });
  } catch (error) {
    console.error('Superprofile subscription update error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`EMOT CARE Backend running on port ${PORT}`);
});
