import { Server } from 'socket.io';
import { PrismaClient, Prisma } from '@prisma/client';
import Cors from 'cors';

const cors = Cors({
    origin: '*',
});

function epoch() {
    //@ts-ignore
    return Math.floor(new Date() / 1000);
}
function unepoch(time) {
    //@ts-ignore
    return new Date(time * 1000);
}

interface Pool {
    [key: string]: Set<string>;
}

const ioHandler = (req, res) => {
    cors(req, res, (err) => {});
    if (!res.socket.server.io) {
        const prisma = new PrismaClient();
        const io = new Server(res.socket.server, {
            cors: {
                origin: '*',
            },
        });
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
                        pool[uid].add(socket.id);
                    } else {
                        pool[uid] = new Set<string>([socket.id]);
                    }
                }
                socket.emit('data', '');
                console.log(pool);
            });

            socket.on('disconnect', function () {
                //@ts-expect-error
                const uid = socket.user;
                if (uid) {
                    if (pool[uid]) {
                        pool[uid].delete(socket.id);
                    } else {
                        pool[uid] = new Set<string>();
                    }
                }
                console.log(pool);
            });

            socket.on('send', async (msg) => {
                const [time, threadId, type, data]: string[] = msg.split('#');
                const thread = prisma.thread.findUnique({
                    where: { id: threadId },
                });
                //@ts-expect-error
                const fromId: string = socket.user;
                prisma.message.create({
                    data: {
                        threadId,
                        fromId,
                        type,
                        data,
                        createdAt: unepoch(parseFloat(time)),
                    },
                });
                const from = await prisma.user.findUnique({
                    where: { id: fromId },
                });
                const fwd = `${time}#${threadId}#${from?.image}#${from?.name}#${from?.id}#${type}#${data}`;
                (await thread.users()).forEach((user) => {
                    if (user.id !== fromId && pool[user.id]) {
                        pool[user.id].forEach((sid) => {
                            io.to(sid).emit('receive', fwd);
                        });
                    }
                });
            });

            socket.on('create', async (msg) => {
                const [name, uids]: string[] = msg.split('#');
                const userIds = uids.split(',');

                prisma.thread.create({
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
