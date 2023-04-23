import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import Users from "../models/userModel.js";
import Groups from "../models/groupModel.js";

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
    // Verify refresh token and grant new access token and auto login
    refresh_token: async (req, res, next) => {
        try {
            const cookies = req.cookies;
            jwt.verify(cookies.refresh_token, config.refreshSecret, 
                async (err, decoded) => {
                    if (err) {
                        next(new ResponseError(400, "Please login or register"));
                    }
                    const accessToken = createAccessToken({ id:decoded.id });
                    const user = await Users.findById(decoded.id);
                    return res.json({ user, accessToken });
                }
            );
        } catch (err) {
            console.log(err);
            next(new ResponseError(400, "Please login or register"));
        }
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
        // Start transaction
            const UsersSession = await Users.startSession();
            const GroupsSession = await Groups.startSession();

            UsersSession.startTransaction();
            GroupsSession.startTransaction();

        try {
            const { id, friendId } = req.body;
            
            // Check if both user exist
            const checkUser = await Users.findById(id);
            if (!checkUser) {
                return next(new ResponseError(400, "User not found"));
            }

            const checkFriend = await Users.findById(friendId);
            if (!checkFriend) {
                return next(new ResponseError(400, "Friend not found"));
            }

            // Check if they're already friend or not
            if (checkUser.friendList.includes(checkFriend._id)) {
                return next(new ResponseError(400, "You're already add this user as a friend"));
            }
            
            // Create group that contains both user and friend
            const group = new Groups({
                name: `${checkUser.name},${checkFriend.name}`,
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

            // Commit transaction
            await UsersSession.commitTransaction();
            await GroupsSession.commitTransaction();
            await UsersSession.endSession();
            await GroupsSession.endSession();

            return res.json({
                user,
                friendUser,
            });
        } catch (error) {
            console.log(error);

            await UsersSession.abortTransaction();
            await GroupsSession.abortTransaction();
            await UsersSession.endSession();
            await GroupsSession.endSession();

            return next(new ResponseError(500, "Something went wrong"));
        }
    },
};

export default userCtrl;