'use strict';

const ReviewDAO = require('../dal/ReviewDao');
const logger = require('../utils/Logger');

class ReviewService {
    constructor() {
        this.reviewDao = new ReviewDAO();
    }

    async getAllReviews() {
        logger.info('ReviewService - Requesting reviews from DAL.');
        return await this.reviewDao.getAllReviews();
    }
}

module.exports = ReviewService;