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

        // Detect if token is address (Dexscreener) or coingecko id
        const isDexToken = token.length > 20 || token.includes('0x');
        
        let priceNow = 0;
        let price5mAgo = 0;
        let metadata: any = {};

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
            
            // Get first pair with highest liquidity
            const pair = dexData.pairs.sort((a: any, b: any) => 
                (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
            )[0];
            
            priceNow = parseFloat(pair.priceUsd || 0);
            
            // Calculate price 5m ago using priceChange.m5
            const change5m = parseFloat(pair.priceChange?.m5 || 0);
            price5mAgo = priceNow / (1 + change5m / 100);
            
            metadata = {
                tokenAddress: token,
                pairAddress: pair.pairAddress,
                baseToken: pair.baseToken,
                quoteToken: pair.quoteToken,
                dexId: pair.dexId,
                volume24h: pair.volume?.h24 || 0,
                liquidity: pair.liquidity?.usd || 0,
                priceChange: {
                    m5: pair.priceChange?.m5 || 0,
                    h1: pair.priceChange?.h1 || 0,
                    h24: pair.priceChange?.h24 || 0
                }
            };
        } else {
            // Fetch from CoinGecko
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
            
            priceNow = cgData[token].usd;
            // For CoinGecko, we estimate 5m ago using 24h change (simplified)
            const change24h = cgData[token].usd_24h_change || 0;
            price5mAgo = priceNow / (1 + (change24h * 0.002 / 100)); // rough estimate
            
            metadata = {
                coingeckoId: token,
                volume24h: cgData[token].usd_24h_vol || 0,
                priceChange24h: change24h
            };
        }

        // Calculate probability using formula
        const change = priceNow - price5mAgo;
        const percentage = (change / price5mAgo) * 100;
        
        // Simple normalization into [0,1]
        const clamp = (x: number, min: number, max: number) => 
            Math.min(Math.max(x, min), max);
        
        const probUp = clamp((percentage + 5) / 10, 0, 1);
        const probDown = 1 - probUp;

        const result = {
            token,
            priceNow,
            price5mAgo,
            change5m: percentage,
            probability: {
                up: probUp,
                down: probDown,
                upPercent: Math.round(probUp * 100),
                downPercent: Math.round(probDown * 100)
            },
            metadata,
            timestamp: new Date().toISOString()
        };

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Probability error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'PROBABILITY_CALCULATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
