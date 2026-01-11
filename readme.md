Serverless Sentiment Analysis Service

A serverless implementation for real-time sentiment analysis. This service processes 100 raw reviews of food outlets from DynamoDB and uses Gemini AI to calculate subject-specific sentiment scores at runtime.
The system provides secure JWT-protected endpoints and handles concurrent processing to deliver accurate sentiment percentages and metadata in seconds.

# Architecture Overview
 The service is built using a 3-Layer Modular Design

    1. Interface Layer (serverless/):

        API Gateway: Exposes the REST endpoint and triggers the Authorizer.

        Lambda Authorizer: Validates JWTs against secrets stored in AWS SSM before requests reach the logic.

        Lambda Handler: Orchestrates the hand-off between AWS events and the internal logic package.

    2. Logic Layer (api-op/):

        Api Processor: Coordinates between data gathering and AI execution.

        Service Layer: Handles business logic, such as subject validation and batching strategies.

        Data Access Layer: Clean interfaces for DynamoDB (Reviews) and SSM (Secrets).

        Transformer: Responsible for aggregating Ai batch Results into final percentage-based response.


    3. Utility Layer (scripts/):

        Local scripts for seeding the database with test data and generating JWT tokens for authorization.

# Request Lifecycle & Interaction Flow

    1. Client Request: The user sends a POST request with the target subject to the API Gateway.

    2. Security Check (Authorizer): A Lambda Authorizer intercepts the request, validates the JWT, and grants or denies access based on the secret in AWS SSM.

    3. Lambda: The handler triggers the ApiProcessor, which fetches the required AI credentials and initializes the services.

    4. Data Retrieval (DynamoDB): The ReviewService scans the database to retrieve exactly 100 raw reviews.

    5. AI Batch Analysis: All 100 reviews are sent to the Gemini 2.5 Flash model in a single prompt to identify relevant reviews and determine sentiment.

    6. Transformation: Aggregates the AI results, calculates the positive percentage, and prepares the final metadata.

    7. Final Response: The API returns a structured JSON response with the score and analysis details to the user.  

# Assumptions and Trade-offs 
    1. Runtime vs. Persistence: The DynamoDB schema is intentionally limited to a single non-key attribute (text). Because of this, I perform analysis at runtime rather than storing pre-calculated scores. This setup demonstrates how LLMs can handle raw, unstructured data on the fly without needing to maintain extra metadata in the database.

    2. Decoupled Logic: Moving core logic to the api-op directory adds file complexity but allows the code to be tested locally.

    3. Security Latency: Fetching secrets from SSM at runtime adds latency, but this is a necessary trade-off to avoid the security risk of plaintext in environment variables.

# Model Selection

    1. Model: Google Gemini 2.5 Flash.

    2. Reasoning: I chose Gemini Flash specifically to handle the batch processing of 100 reviews in one go. Its 1-million token context window means we don't have to worry about truncating the review text, and the low latency keeps the execution time well under the 29 Second API Gateway timeout.

    3. Batching Strategy: While the architecture is designed to support concurrent batching, the service is currently configured to process all 100 reviews in a single AI request. This deliberate choice respects the 15 RPM (Requests Per Minute) free-tier limit while leveraging Gemini's large context window for stability and cost-efficiency.

    4. Response Handling: To prevent the AI from returning a conversational summary, I enforced a strict JSON schema using responseMimeType: "application/json". The prompt (in model/PromptTemplate.js) is designed to return simple integer counts for positive/negative matches. The code also includes a regex-based sanitizer to strip out any markdown backticks (e.g., ```json) that could crash the JSON.parse() method.

# Deployment & Usage

    1. Manual AWS Setup (SSM)

    Create the following parameters in your AWS Systems Manager (ap-south-1) as SecureString:

    /sentiment-analysis/gemini-api-key: Your Google AI Key.

    /sentiment-analysis/jwt-secret: A random string for JWT signing.

    2. Deployment Commands

    # Setup Logic Layer
    cd api-op/sentiment-analysis-service && npm install

    # Deploy to AWS
    cd ../../serverless && npm install
    serverless deploy

    # Seed Data & Generate Token
    cd ../scripts && npm install
    node seedReviews.js
    node generateToken.js

# API Usage & Authentication Flow       

    Auth: Authorization: Bearer <token>
    Endpoint: POST /review-sentiment
    Body: { "subject": "Staff behavior" }

    Sample Response:
    {
        "subject": "Staff behavior",
        "sentimentScore": "64%",
        "analysisDetails": {
            "totalAnalyzed": 100,
            "totalMatched": 25,
            "positiveCount": 16,
            "negativeCount": 9
        }
    }

# Monitoring and Logging 
The service uses Winston for structured logging, integrated with AWS CloudWatch:

    1. JSON Logging: All logs are emitted as JSON objects. This allows AWS CloudWatch Logs Insights to parse fields automatically.

    2. Error Traceability: The utils/Logger.js captures full stack traces for AI failures or DB issues for faster debugging in production.
        
