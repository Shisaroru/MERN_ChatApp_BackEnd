import dotenv from "dotenv";

// Load .env file
dotenv.config();

export const config = {
    mongoURI: process.env.MONGODB_URI || "Your MongoDB connection string",
    port: process.env.PORT || 8080,
    accessSecret: process.env.ACCESS_TOKEN_SECRET || "Your access token secret",
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || "Your refresh token secret",
};