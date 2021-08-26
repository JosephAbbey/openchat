import express, { Express } from 'express';
import * as http from 'http';
import next, { NextApiHandler } from 'next';
import * as socketio from 'socket.io';
import { PrismaClient, Prisma } from '@prisma/client';

require('dotenv').config();

function epoch(time: Date): number {
    //@ts-expect-error
    return Math.floor((new Date() ?? time) / 1000);
}
function unepoch(time: number): Date {
    return new Date(time * 1000);
}

interface Pool {
    [key: string]: Set<string>;
}
const prisma = new PrismaClient();
var pool: Pool = {};

const port: number = parseInt(process.env.PORT || '3000', 10);
const dev: boolean = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler: NextApiHandler = nextApp.getRequestHandler();

nextApp.prepare().then(async () => {
    const app: Express = express();
    const server: http.Server = http.createServer(app);
    const io: socketio.Server = new socketio.Server({
        cors: {
            origin: '*',
        },
    });
    io.attach(server);

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

    app.all('*', (req: any, res: any) => nextHandler(req, res));

    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
});
