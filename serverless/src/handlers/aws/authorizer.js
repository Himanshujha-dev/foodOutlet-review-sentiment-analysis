'use strict';

const { logger, JwtUtils, SecretManagerClient } = require('sentiment-analysis-service');

module.exports.handle = async (event) => {
    logger.info("Authorizer: Validation started");
    
    const token = event.authorizationToken;
    const methodArn = event.methodArn;

    if (!token) {
         logger.warn('Authorizer: No token provided in request')
        return generatePolicy('user', 'Deny', methodArn);
    }
    try {
       
        const secretName = process.env.JWT_SECRET_NAME ;
        logger.info(`Authorizer: Fetching secret from SSM path: ${secretName}`);
        const params = await SecretManagerClient.getParameters([secretName]);
        const secret = params[0]?.Value;

        if (!secret) throw new Error("JWT Secret parameter not found in SSM");

       //clean the token and verify 
        const encodedToken = token.replace('Bearer ', '');
        const decoded = JwtUtils.verifyToken(encodedToken, secret);
        
        if (!decoded) {
            logger.warn('Authorizer Token verification failed Invalid or Expired');
            return generatePolicy('user', 'Deny', methodArn);
        }

        logger.info(`Authorizer Access Granted for: ${decoded.sub}`);
        return generatePolicy(decoded.sub, 'Allow', methodArn);

    } catch (error) {
        logger.error('Authorizer failure during validation', error);
        return generatePolicy('user', 'Deny', methodArn);
    }
};

const generatePolicy = (principalId, effect, resource) => {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [{
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: resource
            }]
        }
    };
};