CREATE TABLE news_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    summary TEXT,
    source TEXT,
    published_at TIMESTAMP,
    sentiment_score DECIMAL,
    created_at TIMESTAMP DEFAULT NOW()
);