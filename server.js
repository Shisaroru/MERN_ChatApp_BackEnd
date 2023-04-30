import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import { config } from "./config.js";
import { ResponseError } from "./class/ResponseError.js";

import socketHandler from "./middleware/socket.io.js";
import authSocket from "./middleware/auth.socket.js";

import userRouter from "./routes/userRouter.js";
import groupRouter from "./routes/groupRouter.js";
import messageRouter from "./routes/messageRouter.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173"
    }
});

// Accept json request
app.use(express.json());

// Enable CORS
app.use(cors());

// Enable req.cookie
app.use(cookieParser());

// Connect to database
mongoose
    .connect(config.mongoURI)
    .then(() => { console.log("Connected to the database"); })
    .catch(err => { console.log(err); });

// Start server
// app.listen(config.port, () => {
//     console.log("Server is listening on port " + config.port);
// });
server.listen(config.port, () => {
    console.log("Server is listening on port " + config.port);
});

// Socket.io middleware
io.use(authSocket);

// Socket.io handlers
const onConnection = (socket) => {
    socketHandler(io, socket);
}
io.on('connection', onConnection);

// Routes
app.use('/api/user', userRouter);
app.use('/api/group', groupRouter);
app.use('/api/message', messageRouter);

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