-- Create essential tables for the real estate estimation platform

-- Users table for admin authentication
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    email VARCHAR,
    is_admin BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Leads table for property estimation requests
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    property_type VARCHAR NOT NULL,
    address VARCHAR NOT NULL,
    city VARCHAR NOT NULL,
    postal_code VARCHAR NOT NULL,
    surface NUMERIC NOT NULL,
    source VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'new',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Estimations table for property valuations
CREATE TABLE IF NOT EXISTS estimations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id VARCHAR REFERENCES leads(id),
    estimated_value NUMERIC NOT NULL,
    min_value NUMERIC NOT NULL,
    max_value NUMERIC NOT NULL,
    confidence_score NUMERIC NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Contacts table for general inquiries
CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR NOT NULL,
    phone VARCHAR,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'new',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Auth sessions table for 2FA
CREATE TABLE IF NOT EXISTS auth_sessions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR NOT NULL,
    is_email_verified BOOLEAN DEFAULT false,
    phone_number VARCHAR,
    is_sms_verified BOOLEAN DEFAULT false,
    verification_sid VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

-- Create a default admin user (password: admin123)
INSERT INTO users (username, password, email, is_admin) 
VALUES ('admin@estimation-immobilier-gironde.fr', '$2b$10$8K1p/a0dqailSRHqHMXinOeRFjt8H4UZJmGeLbPc8m4CRyLF3Wfh6', 'admin@estimation-immobilier-gironde.fr', true)
ON CONFLICT (username) DO NOTHING;