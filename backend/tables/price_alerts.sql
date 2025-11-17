CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    token_symbol TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('price',
    'volume',
    'percentage')),
    threshold_value DECIMAL NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('above',
    'below')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_triggered_at TIMESTAMP
);