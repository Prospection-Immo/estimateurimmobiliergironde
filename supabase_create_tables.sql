-- SCRIPT SQL COMPLET POUR CRÉER TOUTES LES TABLES MANQUANTES
-- Exécuter dans Supabase > SQL Editor

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  variables TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email History
CREATE TABLE IF NOT EXISTS email_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id VARCHAR REFERENCES email_templates(id),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT,
  text_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  send_grid_message_id TEXT,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Auth Sessions
CREATE TABLE IF NOT EXISTS auth_sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  expires_at TIMESTAMP NOT NULL,
  is_email_verified BOOLEAN DEFAULT FALSE,
  phone_number TEXT,
  is_sms_verified BOOLEAN DEFAULT FALSE,
  verification_sid TEXT,
  session_data TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Guide Downloads
CREATE TABLE IF NOT EXISTS guide_downloads (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT,
  guide_id VARCHAR REFERENCES guides(id),
  lead_email TEXT NOT NULL,
  lead_first_name TEXT NOT NULL,
  lead_city TEXT,
  download_type TEXT NOT NULL,
  downloaded_at TIMESTAMP,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Guide Analytics
CREATE TABLE IF NOT EXISTS guide_analytics (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id VARCHAR REFERENCES guides(id),
  date DATE NOT NULL,
  page_views INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  avg_time_on_page INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Guide Email Sequences
CREATE TABLE IF NOT EXISTS guide_email_sequences (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id VARCHAR REFERENCES guides(id),
  sequence_name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  template_id VARCHAR REFERENCES email_templates(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  order_in_sequence INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Persona Configs
CREATE TABLE IF NOT EXISTS persona_configs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  persona TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  psych_profile TEXT NOT NULL,
  pain_points TEXT[] NOT NULL,
  motivations TEXT[] NOT NULL,
  communication_style TEXT NOT NULL,
  preferred_channels TEXT[] NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  icon TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lead Scoring
CREATE TABLE IF NOT EXISTS lead_scoring (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id VARCHAR REFERENCES leads(id) NOT NULL UNIQUE,
  total_score INTEGER NOT NULL DEFAULT 0,
  budget_score INTEGER NOT NULL DEFAULT 0,
  authority_score INTEGER NOT NULL DEFAULT 0,
  need_score INTEGER NOT NULL DEFAULT 0,
  timeline_score INTEGER NOT NULL DEFAULT 0,
  qualification_status TEXT NOT NULL DEFAULT 'unqualified',
  confidence_level INTEGER NOT NULL DEFAULT 50,
  last_calculated_at TIMESTAMP DEFAULT NOW(),
  manual_adjustment INTEGER DEFAULT 0,
  notes TEXT,
  assigned_to TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Scoring Config
CREATE TABLE IF NOT EXISTS scoring_config (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  criteria TEXT NOT NULL,
  sub_criteria TEXT NOT NULL,
  max_points INTEGER NOT NULL,
  scoring_rules TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lead Score History
CREATE TABLE IF NOT EXISTS lead_score_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id VARCHAR REFERENCES leads(id) NOT NULL,
  previous_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  score_change INTEGER NOT NULL,
  change_reason TEXT NOT NULL,
  calculated_by TEXT,
  calculation_details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SMS Campaigns
CREATE TABLE IF NOT EXISTS sms_campaigns (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  audience TEXT NOT NULL,
  created_by TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMP,
  template_id VARCHAR,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  total_contacts INTEGER DEFAULT 0,
  estimated_cost TEXT DEFAULT '0.00',
  actual_cost TEXT DEFAULT '0.00',
  delivery_rate DECIMAL(5,2) DEFAULT 0,
  click_through_rate DECIMAL(5,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  unsubscribe_rate DECIMAL(5,2) DEFAULT 0,
  audience_persona TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  sent_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- SMS Templates
CREATE TABLE IF NOT EXISTS sms_templates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  character_count INTEGER NOT NULL,
  estimated_cost TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SMS Contacts
CREATE TABLE IF NOT EXISTS sms_contacts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  city TEXT,
  postal_code TEXT,
  tags TEXT[] DEFAULT '{}',
  persona TEXT,
  lead_source TEXT,
  opt_in_date TIMESTAMP,
  opt_out_date TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_contacted_at TIMESTAMP,
  total_messages_sent INTEGER DEFAULT 0,
  total_messages_received INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SMS Sent Messages
CREATE TABLE IF NOT EXISTS sms_sent_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR REFERENCES sms_campaigns(id),
  contact_id VARCHAR REFERENCES sms_contacts(id),
  template_id VARCHAR REFERENCES sms_templates(id),
  phone_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  twilio_sid TEXT,
  error_message TEXT,
  cost TEXT DEFAULT '0.05',
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  failed_at TIMESTAMP,
  clicked_at TIMESTAMP,
  replied_at TIMESTAMP,
  reply_content TEXT,
  ip_address TEXT,
  user_agent TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SMS Sequences
CREATE TABLE IF NOT EXISTS sms_sequences (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL,
  target_persona TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  total_messages INTEGER DEFAULT 0,
  enrollment_count INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SMS Sequence Enrollments
CREATE TABLE IF NOT EXISTS sms_sequence_enrollments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id VARCHAR REFERENCES sms_sequences(id),
  contact_id VARCHAR REFERENCES sms_contacts(id),
  current_step INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMP DEFAULT NOW(),
  last_message_sent_at TIMESTAMP,
  completed_at TIMESTAMP,
  paused_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  total_messages_sent INTEGER DEFAULT 0,
  total_replies_received INTEGER DEFAULT 0,
  conversion_achieved BOOLEAN DEFAULT FALSE,
  conversion_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Message de confirmation
SELECT 'Toutes les tables ont été créées avec succès!' as resultat;