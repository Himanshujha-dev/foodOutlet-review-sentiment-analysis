'use strict';
const MODELS = {
    GEMINI_FLASH: 'gemini-2.5-flash-preview-09-2025'
}
module.exports = {
    MODELS,
    ENDPOINTS: {
        AI_URL_TEMPLATE: 'https://generativelanguage.googleapis.com/v1beta/models/{{MODEL}}:generateContent?key={{API_KEY}}'
    },
    CONFIG: {
        ACTIVE_MODEL: MODELS.GEMINI_FLASH,
        DEFAULT_BATCH_SIZE: 100,
        MAX_REVIEWS: 100,
        TEMPERATURE: 0.1,
        RETRY: {
            MAX_ATTEMPTS: 3,
            DELAYS: [2000, 4000, 8000],
        },
        SSM_PATHS: {
            GEMINI_KEY: process.env.GEMINI_API_KEY_NAME,
            JWT_SECRET: process.env.JWT_SECRET_NAME
        }
    },
    HTTP: {
        METHODS: {
            GET: 'GET',
            POST: 'POST',
            PUT: 'PUT',
            DELETE: 'DELETE'
        },
        HEADERS: {
            CONTENT_TYPE_JSON: { 'Content-Type': 'application/json' }
        }
    },
    ERROR_MESSAGES: {
        MISSING_SUBJECT: "Subject is required (e.g., 'Staff behavior')",
        INTERNAL_ERROR: "An unexpected error occurred during analysis",
        AI_PARSE_ERROR: "AI response parsing failed",
        AUTH_FAILURE: "Authentication failed: Invalid token"
    },
    RESPONSES: {
        SUCCESS: {
            COMPLETED: {
                "status": "success",
                "message": "Sentiment analysis completed successfully",
                "statusCode": 200
            }
        },
        ERRORS: {
            SERVER_ERROR: {
                "status": "error",
                "message": "Internal server error occurred",
                "statusCode": 500
            },
            BAD_REQUEST: {
                "status": "error",
                "message": "Bad request error occurred",
                "statusCode": 400
            },
            UNAUTHORIZED: {
                "status": "error",
                "message": "Unauthorized access",
                "statusCode": 401
            }
        }
    }
};