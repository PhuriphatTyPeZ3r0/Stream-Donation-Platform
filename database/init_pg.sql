-- PostgreSQL Schema for Supabase (STRICT LOWERCASE TO PREVENT QUOTING ISSUES)

-- 1. users Table (For Authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    google_id VARCHAR(100) UNIQUE,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    theme_color VARCHAR(20) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. streamer_settings Table
CREATE TABLE IF NOT EXISTS streamer_settings (
    streamer_id VARCHAR(50) PRIMARY KEY,
    promptpay_id VARCHAR(20) NOT NULL,
    min_donation_amount DECIMAL(10, 2) DEFAULT 10.00,
    goal_amount DECIMAL(10, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. donations Table
CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY,
    streamer_id VARCHAR(50) NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    message TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    payment_ref VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
