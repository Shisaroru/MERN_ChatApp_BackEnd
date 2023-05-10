import Messages from "../models/messageModel.js";
import Users from "../models/userModel.js";
import Groups from "../models/groupModel.js";

import { ResponseError } from "../class/ResponseError.js";

const messageCtrl = {
  getMessages: async (req, res, next) => {
    try {
      const { groupId } = req.body;

      if (groupId.length < 24) {
        return next(new ResponseError(400, "Invalid group id"));
      }

      const messagesList = await Messages.find({
        receiver: groupId,
      });
      //.limit(5);

      return res.json({ messagesList });
    } catch (error) {
      console.log(error);
      return next(new ResponseError(500, "Something went wrong"));
    }
  },
  sendMessage: async (req, res, next) => {
    try {
      const { sender, senderName, groupId, message } = req.body;

      if (groupId.length < 24 || sender.length < 24) {
        return next(new ResponseError(400, "Invalid id"));
      }

      if (!message) {
        return next(new ResponseError(400, "Message cannot be empty"));
      }

      const checkUser = await Users.findById(sender);
      const checkGroup = await Groups.findById(groupId);

      if (checkGroup.members.length === 2) {
        const intersect = checkGroup.members.filter((member) =>
          checkUser.friendList.includes(member)
        );
        if (intersect.length < 1) {
          return next(
            new ResponseError(400, "You two are not friends anymore")
          );
        }
      }

      const newMessage = new Messages({
        message,
        sender,
        senderName,
        receiver: groupId,
      });

      await newMessage.save();

      await Groups.findByIdAndUpdate(groupId, {
        latestMessage: message,
      });

      return res.json({
        message: "Message sended",
      });
    } catch (error) {
      console.log(error);
      return next(new ResponseError(500, "Something went wrong"));
    }
  },
};

export default messageCtrl;
