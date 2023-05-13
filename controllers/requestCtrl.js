import Requests from "../models/requestModel.js";
import Users from "../models/userModel.js";
import Groups from "../models/groupModel.js";

import { ResponseError } from "../class/ResponseError.js";

const requestCtrl = {
  createRequest: async (req, res, next) => {
    const RequestsSession = await Requests.startSession();
    const UsersSession = await Users.startSession();

    RequestsSession.startTransaction();
    UsersSession.startTransaction();

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

      const foundRequestee = await Users.findByIdAndUpdate(
        requestee,
        {
          $push: {
            sentRequests: result._id.toString(),
          },
        },
        {
          new: true,
        }
      );

      const foundTarget = await Users.findByIdAndUpdate(
        targetUser,
        {
          $push: {
            requests: result._id.toString(),
          },
        },
        {
          new: true,
        }
      );

      await UsersSession.commitTransaction();
      await RequestsSession.commitTransaction();

      return res.json({
        result,
        foundRequestee,
        foundTarget,
      });
    } catch (error) {
      console.log(error);

      await UsersSession.abortTransaction();
      await RequestsSession.abortTransaction();

      return next(new ResponseError(500, "Something went wrong"));
    } finally {
      await UsersSession.endSession();
      await RequestsSession.endSession();
    }
  },
  replyRequest: async (req, res, next) => {
    // Start transaction
    const UsersSession = await Users.startSession();
    const GroupsSession = await Groups.startSession();
    const RequestsSession = await Requests.startSession();

    UsersSession.startTransaction();
    GroupsSession.startTransaction();
    RequestsSession.startTransaction();

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
      if (checkUser.friendList.includes(checkFriend._id.toString())) {
        return next(
          new ResponseError(400, "You're already add this user as a friend")
        );
      }

      // Modify request array in both user and friend
      const newUserSentRequestArray = checkUser.sentRequests.filter(
        (value) => value !== id
      );
      const newFriendRequestArray = checkFriend.requests.filter(
        (value) => value !== id
      );

      // Check if they were friends before, if so mean that there're a group for them created
      const foundCreatedGroup = await Groups.findOne({
        $and: [
          {
            members: {
              $size: 2,
            },
          },
          {
            members: {
              $elemMatch: { $eq: checkUser._id.toString() },
            },
          },
          {
            members: {
              $elemMatch: { $eq: checkFriend._id.toString() },
            },
          },
        ],
      });

      let friendUser;
      let user;
      let createdGroup;

      if (foundCreatedGroup) {
        createdGroup = foundCreatedGroup;
        user = await Users.findByIdAndUpdate(
          checkUser._id,
          {
            $push: {
              friendList: checkFriend._id.toString(),
            },
            $set: {
              sentRequests: newUserSentRequestArray,
            },
          },
          {
            new: true,
          }
        );

        if (!user) {
          return next(new ResponseError(400, "No user found"));
        }

        friendUser = await Users.findByIdAndUpdate(
          checkFriend._id,
          {
            $push: {
              friendList: checkUser._id.toString(),
            },
            $set: {
              requests: newFriendRequestArray,
            },
          },
          {
            new: true,
          }
        );

        if (!friendUser) {
          return next(new ResponseError(400, "No target user found"));
        }
      } else {
        // Create group that contains both user and friend
        const group = new Groups({
          name: `${checkUser.name},${checkFriend.name}`,
          members: [checkUser._id.toString(), checkFriend._id.toString()],
          admin: [checkUser._id.toString(), checkFriend._id.toString()],
          latestMessage: "",
        });
        createdGroup = await group.save();

        user = await Users.findByIdAndUpdate(
          checkUser._id,
          {
            $push: {
              friendList: checkFriend._id.toString(),
              groupList: createdGroup._id.toString(),
            },
            $set: {
              sentRequests: newUserSentRequestArray,
            },
          },
          {
            new: true,
          }
        );

        if (!user) {
          return next(new ResponseError(400, "No user found"));
        }

        friendUser = await Users.findByIdAndUpdate(
          checkFriend._id,
          {
            $push: {
              friendList: checkUser._id.toString(),
              groupList: createdGroup._id.toString(),
            },
            $set: {
              requests: newFriendRequestArray,
            },
          },
          {
            new: true,
          }
        );

        if (!friendUser) {
          return next(new ResponseError(400, "No target user found"));
        }
      }

      await Requests.findByIdAndDelete(id);

      // Commit transaction
      await UsersSession.commitTransaction();
      await GroupsSession.commitTransaction();
      await RequestsSession.commitTransaction();

      return res.json({
        user,
        friendUser,
        createdGroup,
      });
    } catch (error) {
      console.log(error);

      await UsersSession.abortTransaction();
      await GroupsSession.abortTransaction();
      await RequestsSession.abortTransaction();

      return next(new ResponseError(500, "Something went wrong"));
    } finally {
      await UsersSession.endSession();
      await RequestsSession.endSession();
      await RequestsSession.endSession();
    }
  },
  cancelRequest: async (req, res, next) => {
    try {
      const { id } = req.body;

      if (!id) {
        return next(new ResponseError(400, "Invalid id"));
      }

      const result = await Requests.findByIdAndDelete(id);

      const checkUser = await Users.findById(result.requestee);
      const checkFriend = await Users.findById(result.targetUser);

      const newUserSentRequestArray = checkUser.sentRequests.filter(
        (value) => value !== id
      );
      const newFriendRequestArray = checkFriend.requests.filter(
        (value) => value !== id
      );

      await Users.findByIdAndUpdate(result.requestee, {
        sentRequests: newUserSentRequestArray,
      });

      await Users.findByIdAndUpdate(result.targetUser, {
        requests: newFriendRequestArray,
      });

      return res.json({
        result,
      });
    } catch (error) {
      console.log(error);
      return next(new ResponseError(500, "Something went wrong"));
    }
  },
  getOneRequest: async (req, res, next) => {
    try {
      const { id } = req.body;
      if (!id) {
        return next(new ResponseError(400, "Invalid id"));
      }

      const result = await Requests.findById(id);
      if (!result) {
        return next(new ResponseError(400, "Can't find request"));
      }

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
