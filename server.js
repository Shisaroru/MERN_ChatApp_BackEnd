import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import { config } from "./config.js";
import { ResponseError } from "./class/ResponseError.js";

const app = express();

// Accept json request
app.use(express.json());

// Enable CORS
app.use(cors());

// Connect to database
mongoose
    .connect(config.mongoURI)
    .then(() => { console.log("Connected to the database"); })
    .catch(err => { console.log(err); });

// Start server
app.listen(config.port, () => {
    console.log("Server is listening on port " + config.port);
});

// Handle 404 route, this should be at the end of every other routes
app.use((req, res, next) => {
    return next(new ResponseError(404, "Not Found"));
});

// Error handling middleware, this should be at the end of this file
app.use((err, req, res, next) => {
    return res.status(err.statusCode).json({
        message: err.message,
    });
});