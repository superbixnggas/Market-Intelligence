# API Documentation

## Base Configuration

**Base URL**: `https://bpbtgkunrdzcoyfdhskh.supabase.co/functions/v1/`

**Content-Type**: `application/json`

**Authentication**: Supabase Anonymous Key (for public endpoints)

## Rate Limiting

- **CoinGecko Free Tier**: 10-50 calls/minute
- **Dexscreener**: 100 calls/minute
- **Recommended**: Implement caching (3-5 seconds per token)

## Endpoints

### 1. Probability Analysis

#### GET /probability

Analisis probabilitas naik/turun berdasarkan perubahan harga 5 menit terakhir.

**Parameters:**
- `token` (string, required): Token address (Dexscreener) atau CoinGecko ID

**Examples:**
```bash
# Using CoinGecko ID
curl "https://bpbtgkunrdzcoyfdhskh.supabase.co/functions/v1/probability?token=bitcoin"

# Using contract address
curl "https://bpbtgkunrdzcoyfdhskh.supabase.co/functions/v1/probability?token=0x123...456"
```

**Success Response (200):**
```json
{
  "data": {
    "token": "bitcoin",
    "priceNow": 95269.00,
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
      "priceChange24h": -3.98,
      "marketCap": 1880000000000,
      "lastUpdated": "2025-11-17T22:18:59Z"
    }
  }
}
```

**Error Response (400):**
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Token tidak ditemukan atau tidak valid",
    "details": "Token 'invalid_token' tidak ditemukan di Dexscreener atau CoinGecko"
  }
}
```

**Error Response (429):**
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Terlalu banyak request",
    "retryAfter": 60
  }
}
```

**Error Response (500):**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Terjadi kesalahan internal server"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `token` | string | Token identifier yang digunakan |
| `priceNow` | number | Harga terkini |
| `price5mAgo` | number | Harga 5 menit yang lalu |
| `change5m` | number | Perubahan harga dalam 5 menit (persentase) |
| `probability.up` | number | Probabilitas naik (0-1) |
| `probability.down` | number | Probabilitas turun (0-1) |
| `probability.upPercent` | number | Probabilitas naik (persentase) |
| `probability.downPercent` | number | Probabilitas turun (persentase) |
| `metadata.volume24h` | number | Volume trading 24 jam |
| `metadata.priceChange24h` | number | Perubahan harga 24 jam (persentase) |

### 2. Pulse Detection

#### GET /pulse

Mendeteksi anomali market seperti volume spike, price spike, dan high volatility.

**Parameters:**
- `token` (string, required): Token address atau CoinGecko ID

**Success Response (200):**
```json
{
  "data": {
    "hasAnomaly": true,
    "anomalies": [
      {
        "type": "volume_spike",
        "severity": "high",
        "description": "Volume trading 24 jam meningkat 500%",
        "value": 5000000000,
        "threshold": 1000000000,
        "timestamp": "2025-11-17T22:15:00Z"
      },
      {
        "type": "price_spike",
        "severity": "medium",
        "description": "Fluktuasi harga dalam 5 menit mencapai 8%",
        "value": 8.2,
        "threshold": 5.0,
        "timestamp": "2025-11-17T22:18:00Z"
      }
    ],
    "severity": "high",
    "riskLevel": "CAUTION",
    "metadata": {
      "coingeckoId": "bitcoin",
      "volume24h": 111172010900,
      "priceChange24h": -3.98,
      "volatility": 0.045,
      "volatilityScore": 7.2,
      "lastUpdated": "2025-11-17T22:18:59Z"
    }
  }
}
```

#### Anomaly Types

| Type | Description | Severity Levels |
|------|-------------|-----------------|
| `volume_spike` | Peningkatan volume trading yang signifikan | low, medium, high, critical |
| `price_spike` | Perubahan harga yang ekstrim | low, medium, high, critical |
| `high_volatility` | Volatilitas tinggi | medium, high |
| `liquidity_drop` | Penurunan liquidez | medium, high |
| `whale_activity` | Aktivitas whale terdeteksi | medium, high |

#### Risk Levels

| Level | Description | Action Recommended |
|-------|-------------|-------------------|
| `NORMAL` | Tidak ada anomali | Trading normal |
| `CAUTION` | Anomali minor | Monitor closely |
| `WARNING` | Anomali sedang | Reduce position size |
| `DANGER` | Anomali major | Consider exit |
| `CRITICAL` | Anomali sangat serius | Immediate action |

### 3. Intel Report

#### GET /intel

Gabungan analisis probability + pulse dalam format report yang comprehensive.

**Parameters:**
- `token` (string, required): Token address atau CoinGecko ID

**Success Response (200):**
```json
{
  "data": {
    "token": "bitcoin",
    "summary": "Token menunjukkan tren NETRAL dengan confidence 45%. Terdeteksi anomali volume tinggi (500% increase).",
    "executiveSummary": "Bitcoin menunjukkan kondisi mixed dengan probabilitas naik 55% dalam 5 menit ke depan. Namun, peningkatan volume 500% mengindikasikan aktivitas trading yang intensif. Risk level: CAUTION.",
    "probability": {
      "upPercent": 55,
      "downPercent": 45,
      "change5m": 0.08,
      "confidence": 0.45,
      "trend": "upward"
    },
    "pulse": {
      "hasAnomaly": true,
      "severity": "high",
      "riskLevel": "CAUTION",
      "anomalies": [
        {
          "type": "volume_spike",
          "severity": "high",
          "description": "Volume trading 24 jam meningkat 500%"
        }
      ]
    },
    "priceData": {
      "current": 95269.00,
      "previous5m": 95276.58,
      "high24h": 96800.00,
      "low24h": 93500.00,
      "change24h": -3.98
    },
    "technicalIndicators": {
      "rsi": 45.2,
      "macd": -234.56,
      "bollinger_position": "middle",
      "support": 94500,
      "resistance": 96500
    },
    "recommendation": {
      "action": "HOLD",
      "confidence": "MEDIUM",
      "reasoning": "Probabilitas naik 55% namun ada anomali volume. Disarankan HOLD dan monitor ketat.",
      "entryPrice": 95269.00,
      "stopLoss": 93500.00,
      "takeProfit": 96500.00
    },
    "metadata": {
      "analysisTime": "2025-11-17T22:18:59Z",
      "dataFreshness": "2 seconds",
      "sources": ["coingecko", "dexscreener"]
    }
  }
}
```

#### Recommendation Actions

| Action | Description | Risk Level |
|--------|-------------|------------|
| `BUY` | Rekomendasi untuk buy | Medium to Low |
| `STRONG_BUY` | Buy dengan keyakinan tinggi | Low |
| `HOLD` | Pertahankan posisi saat ini | Medium |
| `WEAK_SELL` | Sell dengan kehati-hatian | Medium to High |
| `SELL` | Rekomendasi untuk sell | High |
| `STRONG_SELL` | Sell dengan keyakinan tinggi | Very High |

### 4. Waifu Persona Response

#### GET /waifu

Generate response dalam karakter persona waifu dengan berbagai mode.

**Parameters:**
- `token` (string, required): Token address atau CoinGecko ID
- `mode` (string, optional): Persona mode ("genki" atau "semangat", default: "genki")

**Success Response (200):**
```json
{
  "data": {
    "mode": "genki",
    "message": "UWAAA SENPAIII!!! Bitcoin menunjukkan probabilitas naik 55% nih! Lumayan banget kan~~ Market agak ribet soalnya ada volume spike tapi tenang aja senpai~ Current price: $95269.00 (+0.08% 5m) Confidence masih medium kok, jadi hati-hati yaa senpai! 💖",
    "personality": "genki",
    "confidence": "medium",
    "mood": "excited_but_cautious",
    "rawData": {
      // Complete intel data
    },
    "emotions": {
      "excitement": 0.7,
      "caution": 0.6,
      "support": 0.9
    }
  }
}
```

#### Persona Modes

| Mode | Description | Personality Traits |
|------|-------------|-------------------|
| `genki` | Mode energik dan ceria | Enthusiastic, supportive, animated |
| `semangat` | Mode semangat dan motivatif | Motivational, encouraging, dramatic |
| `calm` | Mode tenang dan analitis | Analytical, composed, wise (future) |

### 5. News Analysis

#### GET /news

Analisis sentiment dari news terbaru terkait token.

**Parameters:**
- `token` (string, required): Token address atau CoinGecko ID
- `hours` (integer, optional): Time range dalam jam (default: 24)

**Success Response (200):**
```json
{
  "data": {
    "token": "bitcoin",
    "newsCount": 15,
    "sentiment": {
      "overall": "neutral",
      "score": 0.12,
      "positive": 6,
      "negative": 4,
      "neutral": 5
    },
    "topNews": [
      {
        "title": "Bitcoin Reaches New Milestone in Adoption",
        "url": "https://example.com/news/1",
        "sentiment": "positive",
        "score": 0.8,
        "source": "CoinDesk",
        "publishedAt": "2025-11-17T20:30:00Z"
      }
    ],
    "keywords": [
      {
        "word": "adoption",
        "count": 8,
        "sentiment": "positive"
      },
      {
        "word": "regulation",
        "count": 3,
        "sentiment": "negative"
      }
    ]
  }
}
```

### 6. Portfolio Management

#### POST /portfolio

Tambah posisi portfolio baru.

**Request Body:**
```json
{
  "userId": "user_123",
  "token": "bitcoin",
  "amount": 0.5,
  "buyPrice": 95000.00,
  "positionType": "long"
}
```

**Success Response (201):**
```json
{
  "data": {
    "id": "position_456",
    "userId": "user_123",
    "token": "bitcoin",
    "amount": 0.5,
    "buyPrice": 95000.00,
    "currentPrice": 95269.00,
    "pnl": 134.50,
    "pnlPercent": 0.28,
    "positionType": "long",
    "createdAt": "2025-11-17T22:18:59Z"
  }
}
```

#### GET /portfolio

Ambil data portfolio user.

**Parameters:**
- `userId` (string, required): User ID

**Success Response (200):**
```json
{
  "data": {
    "positions": [
      {
        "id": "position_456",
        "token": "bitcoin",
        "amount": 0.5,
        "buyPrice": 95000.00,
        "currentPrice": 95269.00,
        "pnl": 134.50,
        "pnlPercent": 0.28,
        "positionType": "long"
      }
    ],
    "totalValue": 47634.50,
    "totalPnl": 256.75,
    "totalPnlPercent": 0.54
  }
}
```

### 7. Price Alerts

#### POST /alerts

Buat alert harga baru.

**Request Body:**
```json
{
  "userId": "user_123",
  "token": "bitcoin",
  "condition": "above",
  "price": 100000.00,
  "type": "percentage", // "price" or "percentage"
  "message": "Bitcoin reached $100k!"
}
```

**Success Response (201):**
```json
{
  "data": {
    "id": "alert_789",
    "userId": "user_123",
    "token": "bitcoin",
    "condition": "above",
    "price": 100000.00,
    "type": "percentage",
    "isActive": true,
    "createdAt": "2025-11-17T22:18:59Z"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_TOKEN` | 400 | Token tidak valid atau tidak ditemukan |
| `MISSING_PARAMETER` | 400 | Parameter required tidak diberikan |
| `RATE_LIMITED` | 429 | Request rate limit tercapai |
| `EXTERNAL_API_ERROR` | 502 | Error dari external API (CoinGecko/Dexscreener) |
| `INTERNAL_ERROR` | 500 | Error internal server |
| `DATABASE_ERROR` | 500 | Error database operation |
| `AUTHENTICATION_REQUIRED` | 401 | Authentication diperlukan |
| `AUTHORIZATION_FAILED` | 403 | Tidak memiliki akses |

## Caching Strategy

### Recommended Cache Durations
- **Probability data**: 5 seconds
- **Pulse detection**: 10 seconds
- **Intel reports**: 5 seconds
- **News data**: 5 minutes
- **Portfolio data**: 1 minute
- **Price alerts**: Real-time

### Cache Headers
```http
Cache-Control: public, max-age=5
ETag: "abc123"
Last-Modified: Thu, 17 Nov 2025 22:18:59 GMT
```

## WebSocket Support (Future)

**Endpoint**: `wss://bpbtgkunrdzcoyfdhskh.supabase.co/realtime/v1/websocket`

**Subscription example:**
```javascript
const subscription = supabase
  .channel('price_updates')
  .on('postgres_changes', 
    { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'price_alerts',
      filter: `userId=eq.${userId}`
    }, 
    (payload) => {
      console.log('Alert triggered:', payload.new);
    }
  )
  .subscribe();
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bpbtgkunrdzcoyfdhskh.supabase.co',
  'your-anon-key'
);

const getProbability = async (token: string) => {
  const { data, error } = await supabase.functions.invoke('probability', {
    body: { token }
  });
  
  if (error) throw error;
  return data;
};
```

### Python
```python
import requests

BASE_URL = "https://bpbtgkunrdzcoyfdhskh.supabase.co/functions/v1"

def get_probability(token):
    response = requests.get(f"{BASE_URL}/probability", params={"token": token})
    response.raise_for_status()
    return response.json()
```

### cURL
```bash
# Probability analysis
curl -X GET "https://bpbtgkunrdzcoyfdhskh.supabase.co/functions/v1/probability?token=bitcoin" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Intel report with authentication
curl -X GET "https://bpbtgkunrdzcoyfdhskh.supabase.co/functions/v1/intel?token=ethereum" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1637123456
Retry-After: 60
```

## Monitoring & Analytics

### Health Check
```bash
curl "https://bpbtgkunrdzcoyfdhskh.supabase.co/functions/v1/health"
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-17T22:18:59Z",
  "services": {
    "coingecko": "operational",
    "dexscreener": "operational",
    "database": "operational"
  },
  "version": "1.0.0"
}
```

---

**Last Updated**: November 2025  
**API Version**: v1.0  
**Contact**: api@marketintel.io