import Users from "../models/userModel.js";
import Groups from "../models/groupModel.js";

function socketHandler(io, socket, onlineObject) {
  console.log(socket.id, socket.userId);
  onlineObject[socket.userId] = socket.id;

  // get an array of groups and join user in those groups
  socket.on("joined_groups", (arg) => {
    if (arg && arg.length > 0) {
      arg.forEach((value) => {
        socket.join(value._id);
      });
      socket.to([...socket.rooms]).emit("online", socket.userId);
    }
  });

  socket.on("new_request", (id, friendId) => {
    try {
      socket.to(onlineObject[friendId]).emit("new_request", id);
    } catch (error) {}
  });

  socket.on("cancel_request", (id, friendId) => {
    try {
      socket.to(onlineObject[friendId]).emit("cancel_request", id);
    } catch (error) {}
  });

  socket.on("decline_request", (id, friendId) => {
    try {
      socket.to(onlineObject[friendId]).emit("decline_request", id);
    } catch (error) {}
  });

  // Make id user join groupId happen when the other user accepts the request
  socket.on("joined_user", (id, groupId) => {
    try {
      io.in(onlineObject[id]).socketsJoin(groupId);
      socket.to(onlineObject[id]).emit("joined_user", groupId);
    } catch (error) {}
  });

  // send messages to a group
  socket.on("sendMessage", async (arg) => {
    if (io.sockets.adapter.rooms.get(arg.receiver).size === 1) {
      try {
        const group = await Groups.findById(arg.receiver);
        let id;
        if (group.members[0] == arg.sender) {
          id = group.members[1];
        } else {
          id = group.members[0];
        }
        const result = await Users.findById(id);

        if (result.notifications[arg.receiver]) {
          const newObject = { ...result.notifications };
          newObject[arg.receiver]++;
          await Users.findByIdAndUpdate(id, {
            notifications: {
              ...newObject,
            },
          });
        } else {
          const newObject = { ...result.notifications };
          newObject[arg.receiver] = 1;
          await Users.findByIdAndUpdate(id, {
            notifications: {
              ...newObject,
            },
          });
        }
      } catch (error) {
        console.log(error);
      }
    }
    // emit event to everyone except sender
    socket.to(arg.receiver).emit("newMessage", arg);
    // emit event to sender
    socket.emit("newGroup", arg);
  });

  // Emit events know if a user is online or not
  socket.on("checkOnline", (arg) => {
    if (onlineObject[arg]) {
      socket.emit("online", arg);
    } else {
      socket.emit("offline", arg);
    }
  });

  socket.on("disconnecting", (arg) => {
    socket.to([...socket.rooms]).emit("offline", socket.userId);
  });

  socket.on("disconnect", (reason) => {
    console.log("disconnect", reason);
    delete onlineObject[socket.userId];
  });
}

export default socketHandler;
