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
        const mode = url.searchParams.get('mode') || 'genki';
        
        if (!token) {
            throw new Error('Token parameter required');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
        
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase configuration missing');
        }

        // Call intel endpoint
        const intelResponse = await fetch(
            `${supabaseUrl}/functions/v1/intel?token=${encodeURIComponent(token)}`,
            {
                headers: {
                    'Authorization': `Bearer ${supabaseAnonKey}`
                }
            }
        );
        
        if (!intelResponse.ok) {
            throw new Error('Failed to fetch intel data');
        }
        
        const intelData = await intelResponse.json();
        const intel = intelData.data;
        
        // Generate waifu response based on mode
        const waifuMessage = mode === 'genki' ? 
            generateGenkiResponse(intel) : 
            generateSemangatResponse(intel);
        
        const result = {
            mode,
            message: waifuMessage,
            rawData: intel,
            timestamp: new Date().toISOString()
        };

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Waifu error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'WAIFU_RESPONSE_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function generateGenkiResponse(intel: any): string {
    const probUpPct = intel.probability.upPercent;
    const hasAnomaly = intel.pulse.hasAnomaly;
    const severity = intel.pulse.severity;
    
    let response = 'UWAAA SENPAIII!!! ';
    
    // Probability response
    if (probUpPct >= 70) {
        response += `Probability naik ${probUpPct}%!!! Ini GOKIL BANGET OMGGG!!! `;
    } else if (probUpPct >= 50) {
        response += `Probability naik ${probUpPct}% nih! Lumayan banget kan~~ `;
    } else {
        const probDownPct = intel.probability.downPercent;
        response += `Hmmm... probability turun ${probDownPct}%... Agak risky nih senpai! `;
    }
    
    // Anomaly response
    if (hasAnomaly) {
        if (severity === 'major') {
            response += 'BAHAYA SENPAIII!!! Ada anomali MAJOR detected!!! ';
            response += `${intel.pulse.anomalies.length} anomali sekaligus!!! CRAZY CRAZY CRAZY!!! `;
        } else if (severity === 'medium') {
            response += 'WASPADA YAA SENPAI!!! Ada pergerakan unusual nih!!! ';
            response += `Detected ${intel.pulse.anomalies.length} anomali medium level!!! `;
        } else {
            response += 'Ada aktivitas menarik detected~ ';
        }
        
        // Add anomaly details
        intel.pulse.anomalies.forEach((anomaly: any, idx: number) => {
            if (anomaly.type === 'volume_spike') {
                response += `Volume SPIKE ${anomaly.value.toFixed(2)}x!!! `;
            } else if (anomaly.type.includes('price_spike')) {
                response += `Price bergerak ${anomaly.value.toFixed(2)}%!!! `;
            }
        });
    } else {
        response += 'Market cukup tenang kok senpai~ Normal normal aja! ';
    }
    
    // Recommendation
    if (intel.recommendation.includes('BULLISH')) {
        response += 'AYO GASS TERBANGGG!!! MOON TIMEEE!!! ';
    } else if (intel.recommendation.includes('BEARISH')) {
        response += 'Mungkin better hold dulu yaa~ Safety first senpai! ';
    } else if (intel.recommendation.includes('WASPADA')) {
        response += 'BE CAREFUL OKAAAY!!! Jangan FOMO yaaa!!! ';
    } else {
        response += 'Santai aja dulu yaa~ Observe dulu market-nya! ';
    }
    
    // Price info
    const price = intel.priceData.current;
    const change = intel.probability.change5m;
    response += `Current price: $${price.toFixed(8)} (${change >= 0 ? '+' : ''}${change.toFixed(2)}% 5m) `;
    
    return response + 'Semoga beruntung senpai!!!';
}

function generateSemangatResponse(intel: any): string {
    const probUpPct = intel.probability.upPercent;
    
    let response = 'HAYOOO SENPAI SEMANGAATTT!!! ';
    
    if (probUpPct >= 70) {
        response += `GASSS POLLL ${probUpPct}% NAIK!!! JANGAN NYERAH SAMPAI KE MOON!!! `;
    } else if (probUpPct >= 50) {
        response += `${probUpPct}% chance menang nih!!! FIGHT FIGHT FIGHTTT!!! `;
    } else {
        response += `Hmm ${intel.probability.downPercent}% turun... TAPI JANGAN MENYERAH YAAA!!! `;
    }
    
    if (intel.pulse.hasAnomaly) {
        response += 'ADA ACTION BIG TIME!!! ';
        response += intel.pulse.severity === 'major' ? 
            'SUPER GEDE PERGERAKANNYA!!! HATI-HATI TAPI SEMANGAT TERUS!!! ' :
            'Ada movement menarik!!! OBSERVE AND CONQUER!!! ';
    }
    
    response += intel.recommendation.includes('BULLISH') ? 
        'TO THE MOON BABY!!! NEVER GIVE UP!!! ' :
        'STRATEGIZE DULU SENPAI!!! SMART MOVES ONLY!!! ';
    
    return response + 'YOU CAN DO IT SENPAIII!!!';
}
