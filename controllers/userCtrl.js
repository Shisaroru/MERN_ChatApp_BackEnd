import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import Users from "../models/userModel.js";
import { ResponseError } from "../class/ResponseError.js";
import { SearchUser } from "../class/SearchUser.js";
import { config } from "../config.js";

const createAccessToken = (user) => {
    return jwt.sign(user, config.accessSecret, { expiresIn: "4h" }); 
};

const createRefreshToken = (user) => {
    return jwt.sign(user, config.refreshSecret, { expiresIn: "7d" }); 
};

const userCtrl = {
    register: async (req, res, next) => {
        try {
            const { name, email, phoneNumber, password } = req.body;

            const checkUser = await Users.findOne({ email });

            if (checkUser) {
                return next(new ResponseError(400, "This email address is already been used"));
            }
            if (password.length < 6) {
                return next(new ResponseError(400, "Password must be at least 6 characters"));
            }
            
            // Encrypt the password
            const passwordHash = await bcrypt.hash(password, 10)

            const newUser = new Users({ name, email, phoneNumber, password: passwordHash });

            // Save to database
            await newUser.save();

            // Create token
            const accessToken = createAccessToken({ id: newUser._id });
            const refreshToken = createRefreshToken({ id: newUser._id });

            // Save token to cookie
            res.cookie('refresh_token', refreshToken, { 
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24 * 7,
                path: "/user/refresh_token",
            });

            return res.json({
                accessToken
            });
        } catch (error) {
            console.log(error);
            return next(new ResponseError(500, "Something went wrong"));
        }
    },
    login: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            const user = await Users.findOne({ email: email });

            if (!user) {
                return next(new ResponseError(400, "User not found"));
            };

            const checkPassword = await bcrypt.compare(password, user.password);
            if (!checkPassword) {
                return next(new ResponseError(400, "Password is incorrect"));
            };

            // Create token
            const accessToken = createAccessToken({ id: user._id });
            const refreshToken = createRefreshToken({ id: user._id });

            // Save token to cookie
            res.cookie('refresh_token', refreshToken, {
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24 * 7,
                path: "/user/refresh_token",
            });

            return res.json({
                accessToken
            });
        } catch (error) {
            console.log(error);
            return next(new ResponseError(500, "Something went wrong"));
        }
    },
    logout: async (req, res, next) => {
        try {
            res.clearCookie('refresh_token', {
                path: '/user/refresh_token',
            });

            return res.json({
                message: "Logout successfully",
            });
        } catch (error) {
            console.log(error);
            return next(new ResponseError(500, "Something went wrong"));
        }
    },
    getUsers: async (req, res, next) => {
        try {
            const { name } = req.body;

            const filter = new SearchUser(Users.find(), name)
                .filtering()
                .paginating();

            const result = await filter.query

            return res.json({ 
                result,
                length: result.length,
            });
        } catch (error) {
            console.log(error);
            return next(new ResponseError(500, "Something went wrong"));
        }
    },
};

export default userCtrl;