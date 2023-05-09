import jwt from "jsonwebtoken";
import { config } from "../config.js";

function authSocket(socket, next) {
    try {
        const token = socket.handshake.auth.token;

        const decoded = jwt.verify(token, config.accessSecret);
        socket.userId = decoded.id;
        
        next();
    } catch (error) {
        console.log(error)
        next(new Error('Invalid token'));
    }
}

export default authSocket