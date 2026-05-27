// api/frontdoor.js
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ 
            success: false, 
            error: "Missing authorization code" 
        });
    }

    try {
        const clientId = process.env.SF_CLIENT_ID;
        const clientSecret = process.env.SF_CLIENT_SECRET;
        const loginUrl = process.env.SF_LOGIN_URL || 'https://creationtechnology4.my.salesforce.com';
        const redirectUri = process.env.SF_REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
            return res.status(500).json({ 
                success: false, 
                error: "Missing environment variables in Vercel" 
            });
        }

        // Step 1: Exchange code for Access Token
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
            body: JSON.stringify({ scope: 'lightning' })
        });

        const frontdoorData = await frontdoorResponse.json();

        if (!frontdoorData.frontdoorUrl) {
            throw new Error('Failed to generate frontdoor URL');
        }

        return res.status(200).json({
            success: true,
            frontdoorUrl: frontdoorData.frontdoorUrl
        });

    } catch (error) {
        console.error('Frontdoor Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
