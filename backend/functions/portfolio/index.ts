Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Use demo user ID for non-authenticated access
        const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

        // Handle different HTTP methods
        if (req.method === 'GET') {
            return await listPortfolio(DEMO_USER_ID, supabaseUrl, serviceRoleKey, corsHeaders);
        } else if (req.method === 'POST') {
            const data = await req.json();
            return await addPosition(DEMO_USER_ID, data, supabaseUrl, serviceRoleKey, corsHeaders);
        } else if (req.method === 'PUT') {
            const data = await req.json();
            return await updatePosition(DEMO_USER_ID, data, supabaseUrl, serviceRoleKey, corsHeaders);
        } else if (req.method === 'DELETE') {
            const data = await req.json();
            return await deletePosition(DEMO_USER_ID, data.position_id, supabaseUrl, serviceRoleKey, corsHeaders);
        } else {
            throw new Error('Method not allowed');
        }

    } catch (error) {
        console.error('Portfolio error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'PORTFOLIO_OPERATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function listPortfolio(userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/portfolio_positions?user_id=eq.${userId}&select=*&order=created_at.desc`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!response.ok) {
            throw new Error(`Database query failed: ${response.statusText}`);
        }

        const positions = await response.json();

        // Fetch current prices and calculate P/L
        const enrichedPositions = await Promise.all(positions.map(async (pos: any) => {
            // Fetch current price from CoinGecko
            let currentPrice = pos.avg_price; // Default fallback
            try {
                const priceResponse = await fetch(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${pos.token_symbol.toLowerCase()}&vs_currencies=usd`
                );
                if (priceResponse.ok) {
                    const priceData = await priceResponse.json();
                    const tokenId = pos.token_symbol.toLowerCase();
                    if (priceData[tokenId]) {
                        currentPrice = priceData[tokenId].usd;
                    }
                }
            } catch (e) {
                console.error('Price fetch error:', e);
            }

            const totalValue = pos.amount * currentPrice;
            const costBasis = pos.amount * pos.avg_price;
            const profitLoss = totalValue - costBasis;
            const profitLossPercentage = (profitLoss / costBasis) * 100;

            return {
                ...pos,
                current_price: currentPrice,
                total_value: totalValue,
                profit_loss: profitLoss,
                profit_loss_percentage: profitLossPercentage
            };
        }));

        return new Response(JSON.stringify({ positions: enrichedPositions }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('List portfolio error:', error);
        throw error;
    }
}

async function addPosition(userId: string, data: any, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    try {
        const position = {
            user_id: userId,
            token_symbol: data.token_symbol,
            token_address: data.token_address || null,
            amount: parseFloat(data.amount),
            avg_price: parseFloat(data.avg_price)
        };

        const response = await fetch(`${supabaseUrl}/rest/v1/portfolio_positions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(position)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Database insert failed: ${JSON.stringify(errorData)}`);
        }

        const result = await response.json();

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Add position error:', error);
        throw error;
    }
}

async function updatePosition(userId: string, data: any, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    try {
        const updates = {
            amount: parseFloat(data.amount),
            avg_price: parseFloat(data.avg_price),
            updated_at: new Date().toISOString()
        };

        const response = await fetch(`${supabaseUrl}/rest/v1/portfolio_positions?id=eq.${data.position_id}&user_id=eq.${userId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            throw new Error(`Database update failed: ${response.statusText}`);
        }

        const result = await response.json();

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Update position error:', error);
        throw error;
    }
}

async function deletePosition(userId: string, positionId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/portfolio_positions?id=eq.${positionId}&user_id=eq.${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!response.ok) {
            throw new Error(`Database delete failed: ${response.statusText}`);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Delete position error:', error);
        throw error;
    }
}
