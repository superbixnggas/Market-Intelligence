Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const token = url.searchParams.get('token');
        
        if (!token) {
            throw new Error('Token parameter required');
        }

        const isDexToken = token.length > 20 || token.includes('0x');
        
        let pulseData: any = {
            hasAnomaly: false,
            anomalies: [],
            severity: 'normal'
        };

        if (isDexToken) {
            // Fetch from Dexscreener
            const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`);
            
            if (!dexResponse.ok) {
                throw new Error('Failed to fetch from Dexscreener');
            }
            
            const dexData = await dexResponse.json();
            
            if (!dexData.pairs || dexData.pairs.length === 0) {
                throw new Error('No pairs found for this token');
            }
            
            const pair = dexData.pairs.sort((a: any, b: any) => 
                (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
            )[0];
            
            const volumeNow = parseFloat(pair.volume?.h24 || 0);
            const priceChange5m = Math.abs(parseFloat(pair.priceChange?.m5 || 0));
            const priceChange1h = Math.abs(parseFloat(pair.priceChange?.h1 || 0));
            
            // Volume spike detection (comparing with historical avg - simplified)
            // Since we don't have historical data, use heuristic based on liquidity ratio
            const liquidityUsd = parseFloat(pair.liquidity?.usd || 0);
            const volumeToLiquidityRatio = liquidityUsd > 0 ? volumeNow / liquidityUsd : 0;
            
            if (volumeToLiquidityRatio > 2.0) {
                pulseData.anomalies.push({
                    type: 'volume_spike',
                    value: volumeToLiquidityRatio,
                    description: `Volume ${volumeToLiquidityRatio.toFixed(2)}x liquidity`
                });
                pulseData.hasAnomaly = true;
            }
            
            // Price spike detection (>= 2%)
            if (priceChange5m >= 2) {
                pulseData.anomalies.push({
                    type: 'price_spike_5m',
                    value: priceChange5m,
                    description: `Perubahan harga 5m: ${priceChange5m.toFixed(2)}%`
                });
                pulseData.hasAnomaly = true;
            }
            
            // High volatility detection (>= 3%)
            if (priceChange1h >= 3) {
                pulseData.anomalies.push({
                    type: 'high_volatility',
                    value: priceChange1h,
                    description: `Volatilitas tinggi 1h: ${priceChange1h.toFixed(2)}%`
                });
                pulseData.hasAnomaly = true;
            }
            
            // Determine severity
            if (priceChange5m >= 10 || priceChange1h >= 20) {
                pulseData.severity = 'major';
            } else if (priceChange5m >= 5 || priceChange1h >= 10) {
                pulseData.severity = 'medium';
            } else if (pulseData.hasAnomaly) {
                pulseData.severity = 'minor';
            }
            
            pulseData.metadata = {
                tokenAddress: token,
                volumeH24: volumeNow,
                liquidity: liquidityUsd,
                priceChange: {
                    m5: pair.priceChange?.m5 || 0,
                    h1: pair.priceChange?.h1 || 0,
                    h24: pair.priceChange?.h24 || 0
                }
            };
        } else {
            // CoinGecko - limited anomaly detection
            const cgResponse = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
            );
            
            if (!cgResponse.ok) {
                throw new Error('Failed to fetch from CoinGecko');
            }
            
            const cgData = await cgResponse.json();
            
            if (!cgData[token]) {
                throw new Error('Token not found on CoinGecko');
            }
            
            const change24h = Math.abs(cgData[token].usd_24h_change || 0);
            
            if (change24h >= 5) {
                pulseData.anomalies.push({
                    type: 'price_spike_24h',
                    value: change24h,
                    description: `Perubahan harga 24h: ${change24h.toFixed(2)}%`
                });
                pulseData.hasAnomaly = true;
                pulseData.severity = change24h >= 15 ? 'major' : 'medium';
            }
            
            pulseData.metadata = {
                coingeckoId: token,
                volume24h: cgData[token].usd_24h_vol || 0,
                priceChange24h: cgData[token].usd_24h_change || 0
            };
        }

        pulseData.timestamp = new Date().toISOString();

        return new Response(JSON.stringify({ data: pulseData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Pulse error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'PULSE_DETECTION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
