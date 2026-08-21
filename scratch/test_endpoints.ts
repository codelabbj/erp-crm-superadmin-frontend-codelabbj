import axios from 'axios';

// Assuming base URL from existing code
const API_BASE_URL = 'https://codelab.bj'; // Needs to be confirmed from src/lib/api.ts

async function testEndpoints() {
    const endpoints = [
        '/api/audit-logs/',
        '/api/admin/platform-health/summary/',
        '/api/admin/business-metrics/',
        '/api/admin/feature-flags/',
        '/api/admin/security/waf-rules/'
    ];

    for (const ep of endpoints) {
        try {
            console.log(`Testing ${ep}...`);
            // We don't have the token here easily, but a 401/403 means the endpoint EXISTS.
            // A 404 means it DOES NOT exist.
            const resp = await axios.get(`${API_BASE_URL}${ep}`);
            console.log(`${ep}: SUCCESS (${resp.status})`);
        } catch (e: any) {
            if (e.response) {
                console.log(`${ep}: ${e.response.status}`);
            } else {
                console.log(`${ep}: ERROR (${e.message})`);
            }
        }
    }
}

testEndpoints();
