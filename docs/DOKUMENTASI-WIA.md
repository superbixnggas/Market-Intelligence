# Waifu Intel Agency (WIA) - Dokumentasi Sistem

## Deskripsi
Sistem intelijen market real-time yang mengumpulkan data dari Dexscreener dan CoinGecko, lalu mengubahnya menjadi probabilitas naik/turun, pulse/anomaly detection, intel report, dan waifu persona responses.

## URL Deployment
**Frontend**: https://5ee0zczk1wdc.space.minimax.io

## API Endpoints

### 1. Probability Endpoint
**URL**: `https://bpbtgkunrdzcoyfdhskh.supabase.co/functions/v1/probability?token={token}`

Menghitung probabilitas naik/turun berdasarkan perubahan harga 5 menit.

**Response Example**:
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

### 2. Pulse Endpoint
**URL**: `https://bpbtgkunrdzcoyfdhskh.supabase.co/functions/v1/pulse?token={token}`

Mendeteksi anomali seperti volume spike, price spike, dan high volatility.

**Response Example**:
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

### 3. Intel Endpoint
**URL**: `https://bpbtgkunrdzcoyfdhskh.supabase.co/functions/v1/intel?token={token}`

Menggabungkan probability + pulse menjadi intel report.

**Response Example**:
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

### 4. Waifu Endpoint
**URL**: `https://bpbtgkunrdzcoyfdhskh.supabase.co/functions/v1/waifu?token={token}&mode={mode}`

Generate waifu persona response (mode: genki atau semangat).

**Response Example**:
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

## Fitur Frontend

1. **Token Input**: Form untuk input token address (Dexscreener) atau CoinGecko ID
2. **Waifu Mode Toggle**: Switch antara Genki dan Semangat Lebay mode
3. **Auto-refresh**: Update data setiap 5 detik (dapat di-toggle on/off)
4. **Probability Display**: Visual bar chart untuk probabilitas naik/turun
5. **Price Data**: Current price dan 5m ago comparison
6. **Pulse Detection**: Anomaly alerts dengan severity levels
7. **Intel Report**: Summary dan recommendation
8. **Waifu Response**: Persona message berdasarkan mode yang dipilih
9. **Responsive Design**: Mobile dan desktop friendly
10. **Error Handling**: Graceful error display

## Tech Stack

### Backend
- Supabase Edge Functions (Deno runtime)
- Dexscreener API
- CoinGecko API

### Frontend
- React 18 + TypeScript
- Vite build tool
- TailwindCSS
- Lucide React icons

## Cara Menggunakan

1. Buka https://5ee0zczk1wdc.space.minimax.io
2. Masukkan token (contoh: bitcoin, ethereum, atau Solana address)
3. Pilih Waifu Mode (Genki atau Semangat Lebay)
4. Klik "Analyze" atau tunggu auto-refresh
5. Lihat hasil analisis di berbagai section

## Known Issues & Solutions

### Intermittent HTTP 500 Errors
**Penyebab**: Cold start Supabase edge functions atau rate limiting dari external APIs

**Solusi**: 
- Retry otomatis di frontend
- Cache implementation (future improvement)
- Error handling yang graceful

### Rate Limiting
**Penyebab**: CoinGecko API memiliki rate limit untuk free tier

**Solusi**:
- Implementasi caching 3-5 detik per token
- Fallback ke cached data jika API limit tercapai

## Future Improvements

1. Implementasi caching layer untuk mengurangi API calls
2. WebSocket untuk real-time updates
3. Historical data charts
4. Multiple token comparison
5. Alert notifications
6. Saved watchlist
7. Export reports functionality

## Support
Untuk bantuan atau pertanyaan, hubungi MiniMax Agent support.
