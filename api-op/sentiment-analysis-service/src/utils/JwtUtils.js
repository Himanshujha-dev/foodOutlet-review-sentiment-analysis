'use strict';

const jwt = require('jsonwebtoken');
const logger = require('../utils/Logger');

class JwtUtils {
    /**
    
     * @param {string} token  
     * @param {string} secret 
     * @returns {Object|null} 
     */
    static verifyToken(token, secret) {
        if (!token || !secret) {
            logger.warn("JWT Utils: Missing token or secret for verification.");
            return null;
        }

        try {
            return jwt.verify(token, secret);
        } catch (error) {
            logger.warn(`JWT Utils: Verification failed - ${error.message}`);
            return null;
        }
    }
}

module.exports = JwtUtils;