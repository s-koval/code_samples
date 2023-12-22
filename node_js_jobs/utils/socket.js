import socket from 'socket.io';
import socketioJwt from 'socketio-jwt';
import config from '../config';

export default server => {
    const io = socket(server);

    io.users = {};

    io.use(socketioJwt.authorize({
        secret: config.JWT_SECRET,
        handshake: true
    }));

    io.on('connection', client => {

        const { decoded_token: auth } = client;

        io.users[auth.id] = client;

        console.log(`Socket (userId: ${auth.id}): Connection Succeeded.`);

        client.on('disconnect', () => {
            delete io.users[auth.id];
            console.log(`Socket (userId: ${auth.id}): Disconnected.`);

        });
    });

    return io;
}
