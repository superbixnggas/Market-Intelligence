CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    display_name TEXT,
    risk_tolerance TEXT CHECK (risk_tolerance IN ('conservative',
    'moderate',
    'aggressive')),
    preferred_currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW()
);