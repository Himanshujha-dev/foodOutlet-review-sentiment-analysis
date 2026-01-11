'use strict';
class ApiDao {
   
    async executeApi(url, method, body = null, headers = {}) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (body) {
            options.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${data.error?.message || response.statusText}`);
        }

        return data;
    }
}

module.exports = ApiDao;