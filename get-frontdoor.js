import { createServer } from 'lwr';
import { platformWebServerAuthMiddleware } from '@lwrjs/auth-middleware';

const lwrServer = createServer({
    // Your LWR config
    port: 3000,
    rootDir: process.cwd(),
});

const app = lwrServer.getInternalServerApp();

// Attach Salesforce Auth Middleware
app.use(
    platformWebServerAuthMiddleware({
        loginPath: '/auth/login',
        logoutPath: '/auth/logout',
        callbackPath: '/auth/callback',
        config: {
            salesforce: {
                loginUrl: 'https://creationtechnology4.my.site.com',  // or .my.salesforce.com
                clientId: process.env.SF_CLIENT_ID,
                clientSecret: process.env.SF_CLIENT_SECRET,
                redirectUri: 'http://localhost:3000/auth/callback',
                scope: 'api web lightning'
            }
        }
    })
);

// Start server
lwrServer.start();
