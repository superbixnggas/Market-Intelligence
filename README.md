# Market Intelligence Platform

## Overview

Market Intelligence Platform adalah sistem intelijen market real-time yang mengumpulkan data dari Dexscreener dan CoinGecko, lalu mengubahnya menjadi probabilitas naik/turun, pulse/anomaly detection, intel report, dan waifu persona responses.

Platform ini membantu trader dan investor untuk membuat keputusan trading yang lebih informed dengan menyediakan analisis data real-time yang komprehensif dalam format yang mudah dipahami.

## URL Deployment

**Frontend Live**: https://5ee0zczk1wdc.space.minimax.io

## Architecture

### Frontend (`/frontend`)
- **React 18** dengan TypeScript
- **Vite** sebagai build tool
- **TailwindCSS** untuk styling
- **Lucide React** untuk icons
- Responsive design untuk mobile dan desktop

### Backend (`/backend`)
- **Supabase Edge Functions** (Deno runtime)
- **Dexscreener API** untuk data DeFi
- **CoinGecko API** untuk data cryptocurrency
- PostgreSQL database dengan Row Level Security (RLS)

### Database Schema
- `news_cache`: Cache untuk news data
- `portfolio_positions`: Tracking posisi trading
- `price_alerts`: Sistem notifikasi harga
- `user_profiles`: Data profil user

## Fitur Utama

1. **Token Analysis**: Input token address (Dexscreener) atau CoinGecko ID
2. **Probability Engine**: Kalkulasi probabilitas naik/turun berdasarkan perubahan harga 5 menit
3. **Pulse Detection**: Deteksi anomali seperti volume spike, price spike, dan high volatility
4. **Intel Reports**: Gabungan probability + pulse dalam format report
5. **Waifu Personas**: Response generation dalam karakter persona (Genki/Semangat)
6. **Real-time Updates**: Auto-refresh setiap 5 detik
7. **Portfolio Tracking**: Monitor posisi trading
8. **Price Alerts**: Notifikasi perubahan harga signifikan
9. **News Integration**: Cache dan analisis news terbaru

## API Documentation

### Base URL
```
https://bpbtgkunrdzcoyfdhskh.supabase.co/functions/v1/
```

### 1. Probability Analysis
```http
GET /probability?token={token}
```

**Parameter:**
- `token` (string): Token address atau CoinGecko ID

**Response:**
```json
{
  "data": {
    "token": "bitcoin",
    "priceNow": 95269,
    "price5mAgo": 95276.58,
    "change5m": -0.008,
    "probability": {
      "up": 0.499,
      "down": 0.501,
      "upPercent": 50,
      "downPercent": 50
    },
    "metadata": {
      "coingeckoId": "bitcoin",
      "volume24h": 111172010900,
      "priceChange24h": -3.98
    }
  }
}
```

### 2. Pulse Detection
```http
GET /pulse?token={token}
```

**Response:**
```json
{
  "data": {
    "hasAnomaly": false,
    "anomalies": [],
    "severity": "normal",
    "metadata": {
      "coingeckoId": "bitcoin",
      "volume24h": 111172010900,
      "priceChange24h": -3.98
    }
  }
}
```

### 3. Intel Report
```http
GET /intel?token={token}
```

**Response:**
```json
{
  "data": {
    "token": "bitcoin",
    "summary": "Token menunjukkan tren NAIK dengan confidence 0%. Tidak ada anomali signifikan.",
    "probability": {
      "upPercent": 50,
      "downPercent": 50,
      "change5m": -0.008
    },
    "pulse": {
      "hasAnomaly": false,
      "severity": "normal",
      "anomalies": []
    },
    "priceData": {
      "current": 95269,
      "previous5m": 95276.58
    },
    "recommendation": "NETRAL: Market dalam kondisi seimbang. Tunggu signal lebih kuat."
  }
}
```

### 4. Waifu Persona Response
```http
GET /waifu?token={token}&mode={mode}
```

**Parameter:**
- `token` (string): Token address atau CoinGecko ID
- `mode` (string): "genki" atau "semangat"

**Response:**
```json
{
  "data": {
    "mode": "genki",
    "message": "UWAAA SENPAIII!!! Probability naik 50% nih! Lumayan banget kan~~ Market cukup tenang kok senpai~ Normal normal aja! Santai aja dulu yaa~ Observe dulu market-nya! Current price: $95269.00000000 (-0.01% 5m) Semoga beruntung senpai!!!",
    "rawData": {
      // Intel data lengkap
    }
  }
}
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- pnpm (recommended) atau npm
- Supabase CLI

### Frontend Setup
```bash
cd frontend/
pnpm install
pnpm dev
```

**Environment Variables:**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Backend Setup
1. Install Supabase CLI
2. Initialize project:
```bash
supabase init
```

3. Deploy edge functions:
```bash
supabase functions deploy
```

4. Run migrations:
```bash
supabase db push
```

### Database Migration
Run the following SQL to enable RLS policies:
```sql
-- Enable RLS on all tables
ALTER TABLE news_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
CREATE POLICY "Users can view own data" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## Development

### Running Tests
```bash
cd frontend/
pnpm test
```

### Building for Production
```bash
cd frontend/
pnpm build
```

### Deploying Edge Functions
```bash
cd backend/
supabase functions deploy --project-ref bpbtgkunrdzcoyfdhskh
```

## Known Issues & Solutions

### HTTP 500 Errors
**Cause**: Cold start Supabase edge functions atau rate limiting dari external APIs

**Solutions**:
- Retry otomatis di frontend
- Cache implementation (future improvement)
- Error handling yang graceful

### Rate Limiting
**Cause**: CoinGecko API memiliki rate limit untuk free tier

**Solutions**:
- Implementasi caching 3-5 detik per token
- Fallback ke cached data jika API limit tercapai

## Future Roadmap

### Phase 1 (Current)
- ✅ Real-time market analysis
- ✅ Probability calculations
- ✅ Anomaly detection
- ✅ Waifu persona responses

### Phase 2 (Planned)
- [ ] WebSocket untuk real-time updates
- [ ] Advanced charting dengan TradingView
- [ ] Portfolio analytics
- [ ] Sentiment analysis dari news/social media

### Phase 3 (Future)
- [ ] AI-powered trading signals
- [ ] Multi-exchange arbitrage detection
- [ ] Risk management tools
- [ ] Mobile app (React Native)

## Contributing

1. Fork repository ini
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Tech Stack Details

### Frontend Libraries
- React 18.3.1
- TypeScript 5.5.3
- Vite 5.4.1
- TailwindCSS 3.4.1
- Lucide React 0.427.0

### Backend Services
- Supabase (Database + Auth + Edge Functions)
- Dexscreener API
- CoinGecko API

### Development Tools
- ESLint
- PostCSS
- pnpm (package manager)

## License

Proprietary - All rights reserved

## Support

Untuk bantuan teknis atau pertanyaan, silakan buka issue di repository ini atau hubungi tim development.

---

**Last Updated**: November 2025
**Version**: 1.0.0