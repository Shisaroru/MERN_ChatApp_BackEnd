function socketHandler(io, socket) {
    // get an array of groups and join user in those groups
    socket.on('joined_groups', (arg) => {
        if (arg && arg.length > 0) {
            arg.forEach((value) => {
                socket.join(value._id);
            })
        }
    })

    // send messages to a group
    socket.on('sendMessage', (arg) => {
        socket.to(arg.receiver).emit('newMessage', arg);
    });
}

export default socketHandler