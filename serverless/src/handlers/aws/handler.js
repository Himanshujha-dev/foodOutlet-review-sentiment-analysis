'use strict';


const {logger, SentimentAnalysisApiProcessor } = require('sentiment-analysis-service');

module.exports.handle = async (event, context) => {
    logger.info(`Received request event=${JSON.stringify(event)}`);

    try {
        const processor = new SentimentAnalysisApiProcessor();
        const result = await processor.process(event, context);

        return {
            statusCode: result.httpStatusCode || 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*", 
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify(result.body)
        };

    } catch (err) {
         logger.error('Handler failure', err);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                error: "Internal Server Error"
            })
        };
    }
};