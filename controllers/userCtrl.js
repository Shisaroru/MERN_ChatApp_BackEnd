import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import Users from "../models/userModel.js";
import Groups from "../models/groupModel.js";

import { ResponseError } from "../class/ResponseError.js";
import { SearchUser } from "../class/SearchUser.js";
import { config } from "../config.js";

const createAccessToken = (user) => {
    console.log(user);
    return jwt.sign(user, config.accessSecret, { expiresIn: "4h" }); 
};

const createRefreshToken = (user) => {
    return jwt.sign(user, config.refreshSecret, { expiresIn: "7d" }); 
};

const userCtrl = {
    // Verify refresh token and grant new access token and auto login
    refresh_token: async (req, res, next) => {
        const cookies = req.cookies;
        jwt.verify(cookies.refresh_token, config.refreshSecret, 
            (err, decoded) => {
                if (err) {
                    next(new ResponseError(400, "Please login or register"));
                }
                const accessToken = createAccessToken({ id:decoded.id });
                const user = Users.findById(decoded.id);
                return res.json({ user, accessToken });
            }
        );
    },
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
            const result = await newUser.save();

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
                user: result,
                accessToken,
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
                path: "/api/user/refresh_token",
            });

            return res.json({
                user,
                accessToken,
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
    addFriend: async (req, res, next) => {
        try {
            const { id, friendId } = req.body;
            /* HACKED
            Need to check if both user exist.
            Need to check if the friend is already in the list or not.

            I think this need to use transaction
            */

            // Create group that contains both user and friend
            const group = new Groups({
                name: "",
                members: [id, friendId],
                admin: [id, friendId],
                latestMessage: "",
            });
            const createdGroup = await group.save();

            const user = await Users.findByIdAndUpdate(id, {
                "$push": { 
                    "friendList": friendId,
                    "groupList": createdGroup._id,
                },
            }, {
                "new": true,
            });

            if (!user) {
                return next(new ResponseError(400, "No user found"));
            }

            const friendUser = await Users.findByIdAndUpdate(friendId, {
                "$push": { 
                    "friendList": id,
                    "groupList": createdGroup._id,
                },
            }, {
                "new": true,
            });

            if (!friendUser) {
                return next(new ResponseError(400, "No target user found"));
            }

            return res.json({
                user,
                friendUser,
            });
        } catch (error) {
            console.log(error);
            return next(new ResponseError(500, "Something went wrong"));
        }
    },
};

export default userCtrl;