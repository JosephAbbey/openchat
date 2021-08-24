import { Server } from 'socket.io';

const ioHandler = (req, res) => {
    if (!res.socket.server.io) {
        const io = new Server(res.socket.server);

        io.on('connection', (socket) => {
            socket.on('send', (msg) => {
                socket.emit('hello', 'world!');
            });
        });

        res.socket.server.io = io;
    }
    res.end();
};

export const config = {
    api: {
        bodyParser: false,
    },
};

export default ioHandler;
