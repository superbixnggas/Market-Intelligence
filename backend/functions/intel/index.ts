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

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
        
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase configuration missing');
        }

        // Call probability endpoint
        const probResponse = await fetch(
            `${supabaseUrl}/functions/v1/probability?token=${encodeURIComponent(token)}`,
            {
                headers: {
                    'Authorization': `Bearer ${supabaseAnonKey}`
                }
            }
        );
        
        if (!probResponse.ok) {
            throw new Error('Failed to fetch probability data');
        }
        
        const probData = await probResponse.json();
        
        // Call pulse endpoint
        const pulseResponse = await fetch(
            `${supabaseUrl}/functions/v1/pulse?token=${encodeURIComponent(token)}`,
            {
                headers: {
                    'Authorization': `Bearer ${supabaseAnonKey}`
                }
            }
        );
        
        if (!pulseResponse.ok) {
            throw new Error('Failed to fetch pulse data');
        }
        
        const pulseData = await pulseResponse.json();
        
        // Generate intel report
        const probability = probData.data;
        const pulse = pulseData.data;
        
        const intelReport = {
            token,
            summary: generateSummary(probability, pulse),
            probability: {
                upPercent: probability.probability.upPercent,
                downPercent: probability.probability.downPercent,
                change5m: probability.change5m
            },
            pulse: {
                hasAnomaly: pulse.hasAnomaly,
                severity: pulse.severity,
                anomalies: pulse.anomalies
            },
            priceData: {
                current: probability.priceNow,
                previous5m: probability.price5mAgo
            },
            metadata: {
                ...probability.metadata,
                pulseMetadata: pulse.metadata
            },
            recommendation: generateRecommendation(probability, pulse),
            timestamp: new Date().toISOString()
        };

        return new Response(JSON.stringify({ data: intelReport }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Intel error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'INTEL_GENERATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function generateSummary(probability: any, pulse: any): string {
    const trend = probability.probability.upPercent >= 50 ? 'NAIK' : 'TURUN';
    const confidence = Math.abs(probability.probability.upPercent - 50);
    const anomalyText = pulse.hasAnomaly ? 
        ` Terdeteksi ${pulse.anomalies.length} anomali (${pulse.severity}).` : 
        ' Tidak ada anomali signifikan.';
    
    return `Token menunjukkan tren ${trend} dengan confidence ${confidence}%.${anomalyText}`;
}

function generateRecommendation(probability: any, pulse: any): string {
    const upPercent = probability.probability.upPercent;
    
    if (pulse.severity === 'major') {
        return 'WASPADA: Volatilitas sangat tinggi. Risiko besar, potensi gain/loss signifikan.';
    }
    
    if (pulse.severity === 'medium') {
        return 'PERHATIAN: Aktivitas market meningkat. Monitor dengan ketat.';
    }
    
    if (upPercent >= 70) {
        return 'BULLISH: Probabilitas naik tinggi. Pertimbangkan entry dengan risk management.';
    }
    
    if (upPercent <= 30) {
        return 'BEARISH: Probabilitas turun tinggi. Pertimbangkan exit atau hold.';
    }
    
    return 'NETRAL: Market dalam kondisi seimbang. Tunggu signal lebih kuat.';
}
