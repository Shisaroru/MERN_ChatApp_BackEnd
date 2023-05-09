import Requests from "../models/requestModel.js";
import Users from "../models/userModel.js";
import Groups from "../models/groupModel.js";

import { ResponseError } from "../class/ResponseError.js";

const requestCtrl = {
  createRequest: async (req, res, next) => {
    try {
      const { requestee, targetUser, message } = req.body;

      if (!requestee || !targetUser) {
        return next(
          new Error(400, "Must provide both requestee and targetUser")
        );
      }

      const newRequest = new Requests({
        requestee,
        targetUser,
        message: message || "Hi, want to add me as a friend?",
      });

      const result = await newRequest.save();

      return res.json({
        result,
      });
    } catch (error) {
      console.log(error);
      return next(new ResponseError(500, "Something went wrong"));
    }
  },
  replyRequest: async (req, res, next) => {
    // Start transaction
    const UsersSession = await Users.startSession();
    const GroupsSession = await Groups.startSession();

    UsersSession.startTransaction();
    GroupsSession.startTransaction();
    try {
      const { id } = req.body;

      if (!id) {
        return next(new ResponseError(400, "Invalid id"));
      }

      const result = await Requests.findById(id);
      if (!result) {
        return next(new ResponseError(400, "Can not find request"));
      }

      // Check if both user exist
      const checkUser = await Users.findById(result.requestee);
      if (!checkUser) {
        return next(new ResponseError(400, "User not found"));
      }

      const checkFriend = await Users.findById(result.targetUser);
      if (!checkFriend) {
        return next(new ResponseError(400, "Friend not found"));
      }

      // Check if they're already friend or not
      if (checkUser.friendList.includes(checkFriend._id)) {
        return next(
          new ResponseError(400, "You're already add this user as a friend")
        );
      }

      // Create group that contains both user and friend
      const group = new Groups({
        name: `${checkUser.name},${checkFriend.name}`,
        members: [checkUser._id, checkFriend._id],
        admin: [checkUser._id, checkFriend._id],
        latestMessage: "",
      });
      const createdGroup = await group.save();

      const user = await Users.findByIdAndUpdate(
        checkUser._id,
        {
          $push: {
            friendList: checkFriend._id,
            groupList: createdGroup._id,
          },
        },
        {
          new: true,
        }
      );

      if (!user) {
        return next(new ResponseError(400, "No user found"));
      }

      const friendUser = await Users.findByIdAndUpdate(
        checkFriend._id,
        {
          $push: {
            friendList: checkUser._id,
            groupList: createdGroup._id,
          },
        },
        {
          new: true,
        }
      );

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
  cancelRequest: async (req, res, next) => {
    try {
      const { id } = req.body;

      if (!id) {
        return next(new ResponseError(400, "Invalid id"));
      }

      const result = await Requests.findByIdAndDelete(id);

      return res.json({
        result,
      });
    } catch (error) {
      console.log(error);
      return next(new ResponseError(500, "Something went wrong"));
    }
  },
};

export default requestCtrl;
