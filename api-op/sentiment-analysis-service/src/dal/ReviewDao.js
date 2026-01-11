'use strict';
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const logger = require('../utils/Logger');

class ReviewDAO {
    constructor() {
        const client = new DynamoDBClient({ region: process.env.REGION});
        this.docClient = DynamoDBDocumentClient.from(client);
        this.tableName = process.env.REVIEWS_TABLE;
    }

    async getAllReviews() {
        if (!this.tableName) throw new Error("REVIEWS_TABLE env var missing");
        
        const command = new ScanCommand({
            TableName: this.tableName,
            Limit: 100
        });

        try {
            const response = await this.docClient.send(command);
            const items = response.Items || [];
            logger.info(` Review Dao Successfully fetched ${items.length} reviews from ${this.tableName}.`);
            return items;
        } catch (err) {
            logger.error("Review Dao DynamoDB Access Error: %s", err.message);
            throw err;
        }
    }
}

module.exports = ReviewDAO;