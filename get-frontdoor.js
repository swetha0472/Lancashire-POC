// netlify/functions/get-frontdoor.js
exports.handler = async (event, context) => {
    try {
        const { code } = event.queryStringParameters;

        if (!code) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing authorization code" })
            };
        }

        // ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
        // BEST PRACTICE: Use Environment Variables (NOT hardcoded)
        // ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
        const clientId = process.env.SF_CLIENT_ID;
        const clientSecret = process.env.SF_CLIENT_SECRET;
        const redirectUri = process.env.SF_REDIRECT_URI;
        const loginUrl = process.env.SF_LOGIN_URL || 'https://creationtechnology4.my.salesforce.com';

        if (!clientId || !clientSecret || !redirectUri) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Missing environment variables" })
            };
        }

        // Step 1: Exchange code for access token
        const tokenResponse = await fetch(`${loginUrl}/services/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            throw new Error(tokenData.error_description || 'Failed to get access token');
        }

        // Step 2: Get Frontdoor URL for Lightning Out 2.0
        const frontdoorResponse = await fetch(`${loginUrl}/services/oauth2/singleaccess`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenData.access_token}`
            },
            body: JSON.stringify({
                scope: 'lightning'
            })
        });

        const frontdoorData = await frontdoorResponse.json();

        if (!frontdoorData.frontdoorUrl) {
            throw new Error('Failed to generate frontdoor URL');
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',   // Change to your exact domain in production
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({
                frontdoorUrl: frontdoorData.frontdoorUrl,
                success: true
            })
        };

    } catch (error) {
        console.error('Error in get-frontdoor:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: error.message,
                success: false 
            })
        };
    }
};
