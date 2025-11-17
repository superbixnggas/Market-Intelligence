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

        // Call intel endpoint for comprehensive data
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
        
        // Calculate market sentiment metrics
        const sentimentScore = calculateSentimentScore(intel);
        const fearGreedIndex = calculateFearGreedIndex(intel);
        const marketMomentum = calculateMarketMomentum(intel);
        const socialSentiment = analyzeSocialSentiment(intel);
        
        const result = {
            token,
            sentiment: {
                score: sentimentScore,
                label: getSentimentLabel(sentimentScore),
                fearGreedIndex,
                marketMomentum,
                socialSentiment
            },
            indicators: {
                bullishSignals: getBullishSignals(intel),
                bearishSignals: getBearishSignals(intel),
                neutralFactors: getNeutralFactors(intel)
            },
            analysis: generateProfessionalAnalysis(intel, sentimentScore),
            recommendation: intel.recommendation,
            timestamp: new Date().toISOString()
        };

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Sentiment analysis error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'SENTIMENT_ANALYSIS_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function calculateSentimentScore(intel: any): number {
    // Calculate 0-100 sentiment score based on multiple factors
    let score = 50; // Start neutral
    
    // Probability factor (40% weight)
    const probFactor = (intel.probability.upPercent - 50) * 0.8;
    score += probFactor;
    
    // Price change factor (30% weight)
    const priceChangeFactor = Math.min(Math.max(intel.probability.change5m * 3, -15), 15);
    score += priceChangeFactor;
    
    // Anomaly factor (30% weight)
    if (intel.pulse.hasAnomaly) {
        if (intel.pulse.severity === 'major') {
            score -= 10; // High volatility is risky
        } else if (intel.pulse.severity === 'medium') {
            score -= 5;
        }
    }
    
    return Math.min(Math.max(Math.round(score), 0), 100);
}

function calculateFearGreedIndex(intel: any): number {
    // Fear & Greed Index (0 = Extreme Fear, 100 = Extreme Greed)
    let index = 50;
    
    // Price momentum
    if (intel.probability.change5m > 2) index += 20;
    else if (intel.probability.change5m > 0.5) index += 10;
    else if (intel.probability.change5m < -2) index -= 20;
    else if (intel.probability.change5m < -0.5) index -= 10;
    
    // Volatility (anomalies indicate fear)
    if (intel.pulse.hasAnomaly) {
        index -= intel.pulse.severity === 'major' ? 15 : 10;
    }
    
    return Math.min(Math.max(Math.round(index), 0), 100);
}

function calculateMarketMomentum(intel: any): string {
    const change = intel.probability.change5m;
    const upProb = intel.probability.upPercent;
    
    if (change > 1 && upProb > 60) return 'Strong Bull';
    if (change > 0.5 && upProb > 55) return 'Moderate Bull';
    if (change < -1 && upProb < 40) return 'Strong Bear';
    if (change < -0.5 && upProb < 45) return 'Moderate Bear';
    return 'Neutral';
}

function analyzeSocialSentiment(intel: any): string {
    // Simplified social sentiment based on market data
    if (intel.probability.upPercent > 70) return 'Highly Positive';
    if (intel.probability.upPercent > 55) return 'Positive';
    if (intel.probability.upPercent < 30) return 'Highly Negative';
    if (intel.probability.upPercent < 45) return 'Negative';
    return 'Neutral';
}

function getSentimentLabel(score: number): string {
    if (score >= 75) return 'Extremely Bullish';
    if (score >= 60) return 'Bullish';
    if (score >= 40) return 'Neutral';
    if (score >= 25) return 'Bearish';
    return 'Extremely Bearish';
}

function getBullishSignals(intel: any): string[] {
    const signals: string[] = [];
    
    if (intel.probability.upPercent > 60) {
        signals.push('Strong upward probability detected');
    }
    if (intel.probability.change5m > 0.5) {
        signals.push('Positive price momentum in short term');
    }
    if (!intel.pulse.hasAnomaly) {
        signals.push('Stable market conditions');
    }
    
    return signals;
}

function getBearishSignals(intel: any): string[] {
    const signals: string[] = [];
    
    if (intel.probability.downPercent > 60) {
        signals.push('Strong downward probability detected');
    }
    if (intel.probability.change5m < -0.5) {
        signals.push('Negative price momentum in short term');
    }
    if (intel.pulse.severity === 'major') {
        signals.push('High volatility and market anomalies');
    }
    
    return signals;
}

function getNeutralFactors(intel: any): string[] {
    const factors: string[] = [];
    
    if (intel.probability.upPercent >= 45 && intel.probability.upPercent <= 55) {
        factors.push('Balanced probability distribution');
    }
    if (Math.abs(intel.probability.change5m) < 0.3) {
        factors.push('Low price volatility');
    }
    
    return factors;
}

function generateProfessionalAnalysis(intel: any, sentimentScore: number): string {
    const tokenName = intel.token;
    const price = intel.priceData.current;
    const change = intel.probability.change5m;
    const upProb = intel.probability.upPercent;
    
    let analysis = `Market analysis for ${tokenName}: `;
    analysis += `Current price at $${price.toFixed(8)} with ${change >= 0 ? '+' : ''}${change.toFixed(2)}% 5-minute change. `;
    analysis += `Sentiment score: ${sentimentScore}/100 (${getSentimentLabel(sentimentScore)}). `;
    analysis += `Upward probability: ${upProb}%. `;
    
    if (intel.pulse.hasAnomaly) {
        analysis += `Alert: ${intel.pulse.anomalies.length} market anomaly detected (${intel.pulse.severity} severity). `;
    }
    
    return analysis;
}
