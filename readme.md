# Serverless Sentiment Analysis Service

A serverless implementation for real-time sentiment analysis.  
This service processes 100 raw food outlet reviews stored in DynamoDB and uses Gemini AI to calculate subject-based sentiment scores at runtime.

The system provides JWT-protected APIs and processes requests efficiently to return sentiment percentages and related metadata within seconds.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Request Lifecycle & Interaction Flow](#request-lifecycle--interaction-flow)
- [Assumptions and Trade-offs](#assumptions-and-trade-offs)
- [Model Selection](#model-selection)
- [Deployment & Usage](#deployment--usage)
- [API Usage & Authentication Flow](#api-usage--authentication-flow)
- [Monitoring and Logging](#monitoring-and-logging)

---

## Architecture Overview

The service follows a 3-layer modular architecture to keep responsibilities clearly separated.

### 1. Interface Layer (serverless/)

- API Gateway  
  Exposes the REST API endpoint and forwards requests to the Lambda Authorizer.
- Lambda Authorizer  
  Validates JWT tokens using secrets stored in AWS SSM before allowing access.
- Lambda Handler  
  Receives authorized requests and passes them to the internal logic layer.
- Authorizer Placement  
  The JWT Authorizer is implemented inside the serverless layer instead of the core logic package.  
  This ensures that authentication is handled at the API entry point.  
  Unauthorized requests are blocked early and never reach the business logic in the api-op layer.

### 2. Logic Layer (api-op/)

- API Processor  
  Coordinates data retrieval and AI analysis.
- Service Layer  
  Contains the core business logic such as subject validation and request handling.
- Data Access Layer  
  Provides clean access methods for DynamoDB (Reviews table) and AWS SSM (Secrets).
- Transformer  
  Converts AI output into a final percentage-based response format.

### 3. Utility Layer (scripts/)

- Local scripts for seeding test review data into DynamoDB.
- Scripts for generating JWT tokens for API authentication.

---

## Request Lifecycle & Interaction Flow

1. Client Request  
   The client sends a POST request with a target subject to the API Gateway.
2. Authorization Check  
   The Lambda Authorizer validates the JWT token using the secret stored in AWS SSM.
3. Lambda Execution  
   After authorization, the Lambda handler invokes the API Processor.
4. Data Retrieval  
   The ReviewService scans DynamoDB and retrieves exactly 100 raw reviews.
5. AI Sentiment Analysis  
   All 100 reviews are sent in a single request to the Gemini 2.5 Flash model to identify relevant reviews and their sentiment.
6. Result Transformation  
   The AI response is processed to calculate sentiment percentages and prepare metadata.
7. Final Response  
   A structured JSON response containing sentiment results is returned to the client.

---

## Assumptions and Trade-offs

1. Runtime Analysis Instead of Storage  
   The DynamoDB table stores only raw review text and does not store pre-calculated sentiment data.  
   Sentiment analysis is performed at runtime to show how AI models can analyze unstructured data directly.

---

## Model Selection

1. Model Used  
   Google Gemini 2.5 Flash.
2. Reason for Selection  
   Gemini Flash supports large context sizes, allowing all 100 reviews to be analyzed in a single request without truncation.  
   Its low latency keeps execution within the API Gateway timeout limit.
3. Batching Approach  
   All reviews are analyzed in one request to stay within the 15 RPM free-tier limit while keeping results stable and cost-efficient.
4. Response Handling  
   To prevent the AI from returning conversational output, a strict JSON schema is enforced using responseMimeType: "application/json".  
   A sanitizer removes markdown formatting such as ```json blocks to ensure safe JSON parsing.

---

## Deployment & Usage

### 1. Manual AWS Setup (SSM)

Create the following parameters in AWS Systems Manager (ap-south-1) as SecureString values:

- /sentiment-analysis/gemini-api-key  
  Google AI API key
- /sentiment-analysis/jwt-secret  
  Secret used for JWT signing

### 2. Deployment Commands

Setup Logic Layer  
cd api-op/sentiment-analysis-service && npm install

Deploy Serverless Stack  
cd ../../serverless && npm install  
serverless deploy

Seed Data and Generate Token  
cd ../scripts && npm install  
node seedReviews.js  
node generateToken.js

---

## API Usage & Authentication Flow

Authorization Header  
Authorization: Bearer <token>

Endpoint  
POST /review-sentiment

Request Body  
{ "subject": "Staff behavior" }

Sample Response  
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

---

## Monitoring and Logging

The service uses Winston for structured logging and integrates with AWS CloudWatch.

1. Structured Logging  
   Logs are written in JSON format so they can be easily searched using CloudWatch Logs Insights.
2. Error Tracking  
   The custom logger in utils/Logger.js captures full error stack traces to help debug issues in production.
