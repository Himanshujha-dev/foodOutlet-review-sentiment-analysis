'use strict';
class MessagingDto {
    constructor(subject, percentage, metadata = {}) {
        this.subject = subject;
        this.percentage = percentage;
         this.metadata = metadata;
    }

    getResponse() {
        return {
            subject: this.subject,
            sentimentScore: `${this.percentage}%`,
            analysisDetails: {
                totalAnalyzed: this.metadata.totalAnalyzed || 0,
                totalMatched: this.metadata.totalMatched || 0,
                positiveCount: this.metadata.positiveMatches || 0,
                negativeCount: this.metadata.negativeMatches || 0
            }
        };
    }
}

module.exports = MessagingDto;