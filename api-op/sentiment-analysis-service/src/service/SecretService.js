'use strict';

const SecretManagerClient = require('../dal/SecretManagerClient');
const logger = require('../utils/Logger');


class SecretService {
    /**
     * @param {string} path 
     */
    async getSecret(path) {
        logger.info('SecretService Fetching parameter from SSM path');
        try {
            const parameters = await SecretManagerClient.getParameters([path]);
            const secret = parameters[0]?.Value;
            
            if (!secret) {
                throw new Error(`Secret not found at path: ${path}`);
            }
            logger.info('SecretService Successfully retrieved secret from path');
            
            return secret.trim();;
        } catch (error) {
            logger.error('SecretService: Failed to retrieve secret: %s', error.message);
            throw error;
        }
    }
}

module.exports = SecretService;