'use strict';

const ApiDao = require("../dal/AiDao");
const { getAnalysisPrompt } = require('../model/PromptTemplate');
const { ENDPOINTS, CONFIG } = require('../model/Constants');
const logger = require('../utils/Logger');

class AiAnalysisService {
    constructor() {
        this.apiDao = new ApiDao();
    }
    async analyze(subject, batch, apiKey) {

        if (!apiKey) throw new Error("[AiService] API Key is required.");

        const url = ENDPOINTS.AI_URL_TEMPLATE
            .replace('{{MODEL}}', CONFIG.ACTIVE_MODEL)
            .replace('{{API_KEY}}', apiKey);

        logger.info(`Using model ${CONFIG.ACTIVE_MODEL} for analysis.`);
        const prompt = getAnalysisPrompt(subject, batch);

        const { MAX_ATTEMPTS, DELAYS } = CONFIG.RETRY;

        for (let attempt = 0; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                const payload = {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: CONFIG.TEMPERATURE,
                        responseMimeType: "application/json"
                    }
                };

                const data = await this.apiDao.executeApi(url, 'POST', payload);

                const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!content) throw new Error("Empty AI response");

                const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();
                return JSON.parse(cleanJson);

            } catch (error) {
                const isRetryable = error.message.includes('429') || error.message.toLowerCase().includes('quota');

                if (attempt < MAX_ATTEMPTS && isRetryable) {
                    logger.warn(`[AiService] Quota limit hit. Retry ${attempt + 1} in ${DELAYS[attempt]}ms...`);
                    await new Promise(res => setTimeout(res, DELAYS[attempt]));
                    continue;
                }
                throw error;
            }
        }
    }
}

module.exports = AiAnalysisService;