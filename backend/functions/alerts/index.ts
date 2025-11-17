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
            return await listAlerts(DEMO_USER_ID, supabaseUrl, serviceRoleKey, corsHeaders);
        } else if (req.method === 'POST') {
            const data = await req.json();
            return await createAlert(DEMO_USER_ID, data, supabaseUrl, serviceRoleKey, corsHeaders);
        } else if (req.method === 'PUT') {
            const data = await req.json();
            return await updateAlert(DEMO_USER_ID, data, supabaseUrl, serviceRoleKey, corsHeaders);
        } else if (req.method === 'DELETE') {
            const data = await req.json();
            return await deleteAlert(DEMO_USER_ID, data.alert_id, supabaseUrl, serviceRoleKey, corsHeaders);
        } else {
            throw new Error('Method not allowed');
        }

    } catch (error) {
        console.error('Alerts error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'ALERT_OPERATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function listAlerts(userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/price_alerts?user_id=eq.${userId}&select=*&order=created_at.desc`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!response.ok) {
            throw new Error(`Database query failed: ${response.statusText}`);
        }

        const alerts = await response.json();

        // Check alert status and current values
        const enrichedAlerts = await Promise.all(alerts.map(async (alert: any) => {
            let currentValue = 0;
            let triggered = false;

            try {
                // Fetch current price/volume based on alert type
                if (alert.alert_type === 'price') {
                    const priceResponse = await fetch(
                        `https://api.coingecko.com/api/v3/simple/price?ids=${alert.token_symbol.toLowerCase()}&vs_currencies=usd`
                    );
                    if (priceResponse.ok) {
                        const priceData = await priceResponse.json();
                        const tokenId = alert.token_symbol.toLowerCase();
                        if (priceData[tokenId]) {
                            currentValue = priceData[tokenId].usd;
                            
                            // Check if alert is triggered
                            if (alert.direction === 'above') {
                                triggered = currentValue >= alert.threshold_value;
                            } else {
                                triggered = currentValue <= alert.threshold_value;
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Alert check error:', e);
            }

            return {
                ...alert,
                current_value: currentValue,
                triggered: triggered
            };
        }));

        return new Response(JSON.stringify({ alerts: enrichedAlerts }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('List alerts error:', error);
        throw error;
    }
}

async function createAlert(userId: string, data: any, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    try {
        const alert = {
            user_id: userId,
            token_symbol: data.token_symbol,
            alert_type: data.alert_type || 'price',
            threshold_value: parseFloat(data.threshold_value),
            direction: data.direction || 'above',
            is_active: true
        };

        const response = await fetch(`${supabaseUrl}/rest/v1/price_alerts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(alert)
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
        console.error('Create alert error:', error);
        throw error;
    }
}

async function updateAlert(userId: string, data: any, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    try {
        const updates: any = {};
        
        if (data.is_active !== undefined) {
            updates.is_active = data.is_active;
        }
        if (data.threshold_value !== undefined) {
            updates.threshold_value = parseFloat(data.threshold_value);
        }
        if (data.direction !== undefined) {
            updates.direction = data.direction;
        }
        
        updates.updated_at = new Date().toISOString();

        const response = await fetch(`${supabaseUrl}/rest/v1/price_alerts?id=eq.${data.alert_id}&user_id=eq.${userId}`, {
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
        console.error('Update alert error:', error);
        throw error;
    }
}

async function deleteAlert(userId: string, alertId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/price_alerts?id=eq.${alertId}&user_id=eq.${userId}`, {
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
        console.error('Delete alert error:', error);
        throw error;
    }
}
