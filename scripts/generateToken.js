'use strict';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') }); 
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env[process.env.JWT_SECRET];

if (!JWT_SECRET) {
    console.error(" ERROR: JWT_SECRET not found in .env file.");
    process.exit(1);
}

const payload = {
    sub: "assignment-user-001",
    name: "Student Tester",
    role: "tester"
};

// Generate token (valid for 1 hour)
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

console.log("=========================================\n");
console.log(`Bearer ${token}`);