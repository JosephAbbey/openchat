import { Server } from 'socket.io';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

function epoch() {
    //@ts-ignore
    return Math.floor(new Date() / 1000);
}
function unepoch(time) {
    //@ts-ignore
    return new Date(time * 1000);
}

interface Pool {
    [key: string]: string[];
}

const ioHandler = (req, res) => {
    if (!res.socket.server.io) {
        const io = new Server(res.socket.server);
        var pool: Pool = {};

        io.on('connection', (socket) => {
            socket.on('handshake', async (msg) => {
                const uid = (
                    await prisma.session.findUnique({
                        where: { sessionToken: msg },
                    })
                )?.userId;
                //@ts-expect-error
                socket.user = uid;
                if (uid) {
                    if (pool[uid]) {
                        pool[uid].push(socket.id);
                    } else {
                        pool[uid] = [socket.id];
                    }
                }
                socket.emit('data', '');
            });

            socket.on('send', async (msg) => {
                const [time, threadId, type, data]: string[] = msg.split('#');
                console.log(unepoch(time), threadId, type, data);
                const thread = prisma.thread.findUnique({
                    where: { id: threadId },
                });
                //@ts-expect-error
                const fromId: string = socket.user;
                const message = prisma.message.create({
                    data: {
                        threadId,
                        fromId,
                        type,
                        data,
                        createdAt: unepoch(parseFloat(time)),
                    },
                });
                const user = await prisma.user.findUnique({
                    //@ts-expect-error
                    where: { id: socket.user },
                });
                const fwd = `${time}#${threadId}#${user?.image}#${user?.name}#${user?.id}#${type}#${data}`;
                (await thread.users()).forEach((user) => {
                    //@ts-expect-error
                    if (user !== socket.user && pool[user.id]) {
                        pool[user.id].forEach((sid) => {
                            io.to(sid).emit('receive', fwd);
                        });
                    }
                });
            });

            socket.on('create', async (msg) => {
                const [name, uids]: string[] = msg.split('#');
                const userIds = uids.split(',');

                const thread = await prisma.thread.create({
                    data: {
                        name,
                        users: {
                            connect: userIds.map((e) => ({
                                id: e,
                            })),
                        },
                    },
                });
            });

            socket.emit('handshake');
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
