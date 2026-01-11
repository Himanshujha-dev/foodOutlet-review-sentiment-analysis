'use strict';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const { DynamoDBClient, BatchWriteItemCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const { v4: uuidv4 } = require('uuid');

// Configuration
const REGION = process.env.REGION ;
const TABLE_NAME = process.env.REVIEWS_TABLE ;

const client = new DynamoDBClient({ region: REGION });

const subjects = [
    "Staff behavior", "Cleanliness", "Taste / food quality", 
    "Ambience", "Family suitability", "Noise levels", "Pricing / charges"
];

const posTemplates = [
    "I was absolutely {adj} by the {sub}, it was {rating}!", 
    "The {sub} here is {rating}.", 
    "Five stars for the {sub}.",
    "Really enjoyed how {rating} the {sub} felt today.",
    "The {sub} is definitely their strongest point, very {rating}.",
    "We had a {rating} experience with the {sub}."
];

const negTemplates = [
    "The {sub} was a {adj} disaster.", 
    "Extremely disappointed with the {sub}, it was {rating}.", 
    "Avoid this place if you value decent {sub}.",
    "The {sub} was honestly quite {rating}.",
    "Hard to recommend given how {rating} the {sub} was.",
    "The {sub} felt {adj} and {rating}."
];

const posAdjectives = ["blown away", "impressed", "surprised", "delighted", "hooked", "pleased"];
const posRatings = ["perfect", "world-class", "excellent", "top-notch", "exceptional", "wonderful"];

const negAdjectives = ["complete", "total", "frustrating", "massive", "unfortunate", "terrible"];
const negRatings = ["terrible", "poor", "unacceptable", "bad", "underwhelming", "horrible"];

function generateReview(subject) {
    const isPositive = Math.random() > 0.4; 
    
    const templates = isPositive ? posTemplates : negTemplates;
    const adjs = isPositive ? posAdjectives : negAdjectives;
    const ratings = isPositive ? posRatings : negRatings;

    // Pick random components
    let text = templates[Math.floor(Math.random() * templates.length)];
    const adj = adjs[Math.floor(Math.random() * adjs.length)];
    const rating = ratings[Math.floor(Math.random() * ratings.length)];

    return text
        .replace(/{sub}/g, subject.toLowerCase())
        .replace(/{adj}/g, adj)
        .replace(/{rating}/g, rating);
}

async function seedData() {
    try {
        await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
        console.log(`Table ${TABLE_NAME} detected Starting seed: 100 unique reviews into ${TABLE_NAME}...`);
    } catch (err) {
        if (err.name === 'ResourceNotFoundException') {
            console.error(`ERROR: Table "${TABLE_NAME}" not found in ${REGION}.`);
            return;
        }
        throw err;
    }

    for (let i = 0; i < 4; i++) {
        const batchItems = Array.from({ length: 25 }, (_, j) => {
            const subject = subjects[(i * 25 + j) % subjects.length];
            const reviewText = generateReview(subject);
            
            return {
                PutRequest: {
                    Item: marshall({
                        reviewId: uuidv4(),
                        review_text: reviewText
                    })
                }
            };
        });

        try {
            await client.send(new BatchWriteItemCommand({ 
                RequestItems: { [TABLE_NAME]: batchItems } 
            }));
            console.log(`Batch ${i + 1}/4 (25 items) uploaded.`);
        } catch (error) {
            console.error(` Batch ${i + 1} failed:`, error.message);
            process.exit(1);
        }
    }
    console.log("Seeding complete 100 varied reviews are now in DynamoDB.");
}

seedData().catch(err => {
    console.error(" Fatal Error:", err.message);
});