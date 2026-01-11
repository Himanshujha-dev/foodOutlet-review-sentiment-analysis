'use strict';

const MessagingDto = require('../model/MessagingDto');
const logger = require('../utils/Logger');

class SentimentTransformer {

    static transformToResponseDto(batchResults, totalAnalyzed, subject) {
        let positive = 0;
        let negative = 0;
        let matched = 0;

        batchResults.forEach(res => {
            positive += parseInt(res.positive || 0);
            negative += parseInt(res.negative || 0);
            matched += parseInt(res.totalMatches || 0);
        });

        const percentage = matched > 0 ? Math.round((positive / matched) * 100) : 0;
        logger.info(`Found ${matched} relevant matches out of ${totalAnalyzed} reviews analyzed for subject: ${subject}`);
        
        const dto = new MessagingDto(subject, percentage, {
            totalAnalyzed: totalAnalyzed,
            totalMatched: matched,
            positiveMatches: positive,
            negativeMatches: negative
        });

        return dto.getResponse();
    }
}

module.exports = SentimentTransformer;