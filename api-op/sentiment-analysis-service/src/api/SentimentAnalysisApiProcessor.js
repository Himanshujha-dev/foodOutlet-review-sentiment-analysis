'use strict';
const ReviewService = require('../service/ReviewService');
const SecretService = require('../service/SecretService');
const AiAnalysisService = require('../service/AiAnalysisService');
const SentimentTransformer = require('../transformer/SentimentTransformer');
const logger = require('../utils/Logger');
const { RESPONSES, CONFIG } = require('../model/Constants');

class SentimentAnalysisApiProcessor {
    constructor() {
        this.secretService = new SecretService();
        this.AiClient = new AiAnalysisService();
        this.reviewService = new ReviewService();
    }

    async process(event) {
        logger.info('api layer- starting Sentiment Analysis Workflow');

        try {

            const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
            const subject = body?.subject || body?.Subject;

            if (!subject) {
                logger.error('Missing subject in request');
                const errorResponse = RESPONSES.ERRORS.BAD_REQUEST;
                return { httpStatusCode: errorResponse.statusCode, body: errorResponse };
            }
           
            
            // Retrieve API Key from Secret Manager
            const apiKey = await this.secretService.getSecret(CONFIG.SSM_PATHS.GEMINI_KEY)
            if (!apiKey) throw new Error("API Key retrieval failed");
            logger.info('Retrieved API Key');

            // Fetch reviews from the database by calling the ReviewService
            const reviews = await this.reviewService.getAllReviews();

            const reviewTexts = reviews.map(r => r.review_text).slice(0, CONFIG.MAX_REVIEWS);
            const totalAnalyzed = reviewTexts.length; 
            logger.info(`Fetched ${totalAnalyzed} reviews for analysis.`);

            // Batch processing of reviews
            const batchSize = CONFIG.DEFAULT_BATCH_SIZE;
            const batches = [];
            for (let i = 0; i < reviewTexts.length; i += batchSize) {
                batches.push(reviewTexts.slice(i, i + batchSize));
            }
            logger.info("batch run successfully");

            const batchResults = await Promise.all(
                batches.map(batch => this.AiClient.analyze(subject, batch, apiKey))
            );
            logger.info("sentiment received from AiAnalysisService");


            const analysisData = SentimentTransformer.transformToResponseDto(batchResults, totalAnalyzed, subject);
            logger.info(`Successfully transformed results for subject: ${subject}`);


            return {
                httpStatusCode: RESPONSES.SUCCESS.COMPLETED.statusCode,
                body: analysisData
            };

        } catch (error) {
            console.error('Workflow Failure:', error);
            return {
                httpStatusCode: RESPONSES.ERRORS.SERVER_ERROR.statusCode,
                body: { error: RESPONSES.ERRORS.SERVER_ERROR.message }
            };
        }
    }
}

module.exports = SentimentAnalysisApiProcessor;