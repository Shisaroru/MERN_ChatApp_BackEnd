function socketHandler(io, socket) {
    console.log(socket.id);

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
        console.log("send");
        // emit event to everyone except sender
        socket.to(arg.receiver).emit('newMessage', arg);
        // emit event to sender
        socket.emit('newGroup', arg);
    });

    socket.on('disconnect', (reason) => {
        console.log('disconnect', reason);
    })
}

export default socketHandler