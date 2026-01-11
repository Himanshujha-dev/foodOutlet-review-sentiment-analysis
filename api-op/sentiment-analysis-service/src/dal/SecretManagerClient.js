'use strict';

const { SSMClient, GetParametersCommand } = require("@aws-sdk/client-ssm");
const logger = require('../utils/Logger');
class SecretManagerClient {
    static async getParameters(names) {
        const client = new SSMClient({ region: process.env.REGION});
        
        const command = new GetParametersCommand({
            Names: names,
            WithDecryption: true
        });
        try {
            const response = await client.send(command);
            return response.Parameters || [];
        } catch (error) {
            logger.error("[SecretManagerClient] SSM Fetch Error:", error.message);
            throw error;
        }
    }
}

module.exports = SecretManagerClient;