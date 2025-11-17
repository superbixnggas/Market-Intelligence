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
        const action = url.searchParams.get('action') || 'position-sizing';

        let result;
        const requestData = req.method === 'POST' ? await req.json() : {};

        switch (action) {
            case 'position-sizing':
                result = calculatePositionSize(requestData);
                break;
            case 'risk-reward':
                result = calculateRiskReward(requestData);
                break;
            case 'portfolio-risk':
                result = assessPortfolioRisk(requestData);
                break;
            case 'diversification':
                result = analyzeDiversification(requestData);
                break;
            case 'stop-loss':
                result = calculateStopLoss(requestData);
                break;
            default:
                throw new Error('Invalid action');
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Risk management error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'RISK_CALCULATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function calculatePositionSize(data: any): any {
    const accountSize = data.accountSize || 10000;
    const riskPercentage = data.riskPercentage || 2; // Default 2%
    const entryPrice = data.entryPrice || 0;
    const stopLoss = data.stopLoss || 0;

    if (!entryPrice || !stopLoss) {
        throw new Error('Entry price and stop loss are required');
    }

    const riskAmount = accountSize * (riskPercentage / 100);
    const priceRisk = Math.abs(entryPrice - stopLoss);
    const positionSize = riskAmount / priceRisk;

    return {
        accountSize,
        riskPercentage,
        riskAmount: riskAmount.toFixed(2),
        entryPrice,
        stopLoss,
        priceRisk: priceRisk.toFixed(2),
        recommendedPositionSize: positionSize.toFixed(4),
        maxInvestment: (positionSize * entryPrice).toFixed(2),
        recommendation: `Position size of ${positionSize.toFixed(4)} units (max investment: $${(positionSize * entryPrice).toFixed(2)}) to risk ${riskPercentage}% of account`
    };
}

function calculateRiskReward(data: any): any {
    const entryPrice = data.entryPrice || 0;
    const stopLoss = data.stopLoss || 0;
    const takeProfit = data.takeProfit || 0;
    const positionSize = data.positionSize || 1;

    if (!entryPrice || !stopLoss || !takeProfit) {
        throw new Error('Entry price, stop loss, and take profit are required');
    }

    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    const ratio = reward / risk;
    
    const potentialLoss = risk * positionSize;
    const potentialProfit = reward * positionSize;
    const lossPercentage = (risk / entryPrice) * 100;
    const profitPercentage = (reward / entryPrice) * 100;

    return {
        entryPrice,
        stopLoss,
        takeProfit,
        positionSize,
        risk: risk.toFixed(2),
        reward: reward.toFixed(2),
        ratio: ratio.toFixed(2),
        risk_reward_ratio: ratio,
        riskPercent: lossPercentage.toFixed(2),
        rewardPercent: profitPercentage.toFixed(2),
        potential_loss: potentialLoss,
        potential_profit: potentialProfit,
        loss_percentage: lossPercentage,
        profit_percentage: profitPercentage,
        is_good_trade: ratio >= 2,
        assessment: ratio >= 2 ? 'Good' : ratio >= 1.5 ? 'Acceptable' : 'Poor',
        recommendation: ratio >= 2 ? 
            'Excellent risk/reward ratio. Trade aligns with risk management principles.' : 
            ratio >= 1.5 ? 
            'Acceptable ratio. Consider if other factors support the trade.' : 
            'Poor ratio. Consider adjusting targets or avoiding this trade.'
    };
}

function assessPortfolioRisk(data: any): any {
    const positions = data.positions || [];
    
    if (positions.length === 0) {
        return {
            totalPositions: 0,
            riskScore: 0,
            assessment: 'No positions',
            recommendations: []
        };
    }

    let totalValue = 0;
    let totalRisk = 0;
    const positionRisks = [];

    for (const position of positions) {
        const value = position.value || 0;
        const volatility = position.volatility || 0.5; // Default medium volatility
        const risk = value * volatility;
        
        totalValue += value;
        totalRisk += risk;
        positionRisks.push({ token: position.token, risk, volatility });
    }

    const avgVolatility = totalRisk / totalValue;
    const riskScore = Math.min(avgVolatility * 100, 100);

    const recommendations = [];
    if (riskScore > 70) recommendations.push('Portfolio has high risk exposure. Consider diversifying into stable assets.');
    if (riskScore > 50) recommendations.push('Moderate risk level. Monitor positions closely and set stop losses.');
    if (riskScore < 30) recommendations.push('Low risk portfolio. Consider allocating small portion to high-growth opportunities.');

    return {
        totalPositions: positions.length,
        totalValue: totalValue.toFixed(2),
        totalRisk: totalRisk.toFixed(2),
        riskScore: riskScore.toFixed(2),
        assessment: riskScore > 70 ? 'High Risk' : riskScore > 40 ? 'Moderate Risk' : 'Low Risk',
        recommendations,
        topRiskyPositions: positionRisks.sort((a, b) => b.risk - a.risk).slice(0, 3)
    };
}

function analyzeDiversification(data: any): any {
    const positions = data.positions || [];
    
    if (positions.length === 0) {
        return {
            diversificationScore: 0,
            assessment: 'No positions to analyze'
        };
    }

    // Calculate concentration
    const totalValue = positions.reduce((sum, p) => sum + (p.value || 0), 0);
    const concentrations = positions.map(p => ({
        token: p.token,
        percentage: ((p.value / totalValue) * 100).toFixed(2)
    }));

    // Check if any position is > 30% (high concentration)
    const highConcentration = concentrations.filter(c => parseFloat(c.percentage) > 30);
    
    // Calculate HHI (Herfindahl-Hirschman Index)
    const hhi = concentrations.reduce((sum, c) => sum + Math.pow(parseFloat(c.percentage), 2), 0);
    const diversificationScore = Math.max(0, 100 - (hhi / 100));

    return {
        totalPositions: positions.length,
        diversificationScore: diversificationScore.toFixed(2),
        concentrationIndex: hhi.toFixed(2),
        assessment: diversificationScore > 70 ? 'Well Diversified' : 
                    diversificationScore > 40 ? 'Moderately Diversified' : 'Poorly Diversified',
        concentrations,
        highConcentrationAssets: highConcentration,
        recommendations: highConcentration.length > 0 ? 
            ['Reduce concentration in top holdings', 'Consider allocating to more assets'] : 
            ['Diversification is adequate', 'Continue monitoring portfolio balance']
    };
}

function calculateStopLoss(data: any): any {
    const entryPrice = data.entryPrice || 0;
    const riskTolerance = data.riskTolerance || 'moderate'; // conservative, moderate, aggressive
    const volatility = data.volatility || 'medium'; // low, medium, high

    if (!entryPrice) {
        throw new Error('Entry price is required');
    }

    // Stop loss percentages based on risk tolerance and volatility
    const stopLossMatrix = {
        conservative: { low: 2, medium: 3, high: 5 },
        moderate: { low: 3, medium: 5, high: 8 },
        aggressive: { low: 5, medium: 8, high: 12 }
    };

    const stopLossPercent = stopLossMatrix[riskTolerance][volatility];
    const stopLossPrice = entryPrice * (1 - stopLossPercent / 100);
    const takeProfitPercent = stopLossPercent * 2; // 2:1 reward/risk
    const takeProfitPrice = entryPrice * (1 + takeProfitPercent / 100);

    return {
        entryPrice,
        riskTolerance,
        volatility,
        stopLossPercent,
        stopLossPrice: stopLossPrice.toFixed(2),
        takeProfitPercent,
        takeProfitPrice: takeProfitPrice.toFixed(2),
        potentialLoss: (entryPrice - stopLossPrice).toFixed(2),
        potentialGain: (takeProfitPrice - entryPrice).toFixed(2),
        riskRewardRatio: 2,
        recommendation: `Set stop loss at $${stopLossPrice.toFixed(2)} (${stopLossPercent}% below entry) and take profit at $${takeProfitPrice.toFixed(2)} (${takeProfitPercent}% above entry)`
    };
}
