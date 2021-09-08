import { createServer, Server } from 'http';
import next, { NextApiHandler } from 'next';
import * as socketio from 'socket.io';
import { PrismaClient, Prisma } from '@prisma/client';

require('dotenv').config();

function epoch(time?: Date): number {
    //@ts-expect-error
    return Math.floor((new Date() ?? time) / 1000);
}
function unepoch(time: number): Date {
    return new Date(time * 1000);
}
interface buf {
    buffer: Buffer;
    mime: string;
    encoding: string;
}
function dataURLToBuffer(url: string): buf {
    var data = url.split(':')[1].split(',')[0].split(';');
    return {
        buffer: Buffer.from(url.split(',')[1]),
        mime: data[0],
        encoding: data.slice(1).join(';'),
    };
}
function bufferToDataURL(buffer: buf): string {
    return (
        'data:' +
        buffer.mime +
        ';' +
        buffer.encoding +
        ',' +
        buffer.buffer.toString()
    );
}
interface Pool {
    [key: string]: Set<string>;
}
const prisma = new PrismaClient();
var pool: Pool = {};

const port: number = parseInt(process.env.PORT || '3000', 10);
const dev: boolean = process.env.NODE_ENV !== 'production';
const nextApp = next({
    dev,
    conf: {
        reactStrictMode: true,
    },
});
const nextHandler: NextApiHandler = nextApp.getRequestHandler();

var devlog = (msg: any) => {
    if (dev) {
        console.log(msg);
    }
};

var setConvertArray = (json: Array<any>): Array<any> => {
    var o: Array<any> = [];
    for (var item of json) {
        if (item instanceof Set) {
            o.push(Array.from(item));
        } else if (item instanceof Array) {
            o.push(setConvertArray(item));
        } else if (item instanceof Object) {
            o.push(setConvertObject(item));
        } else {
            o.push(item);
        }
    }
    return o;
};
var setConvertObject = (json: object): object => {
    var o = {};
    for (var key in json) {
        var item = json[key];
        if (item instanceof Set) {
            o[key] = Array.from(item);
        } else if (item instanceof Array) {
            o[key] = setConvertArray(item);
        } else if (item instanceof Object) {
            o[key] = setConvertObject(item);
        } else {
            o[key] = item;
        }
    }
    return o;
};

nextApp.prepare().then(async () => {
    const server: Server = createServer((req: any, res: any) =>
        nextHandler(req, res)
    );
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
            devlog(
                '\x1b[32mjoin\x1b[37m  - ' +
                    uid +
                    ' - ' +
                    msg +
                    ' - ' +
                    JSON.stringify(setConvertObject(pool), undefined, 4)
            );
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
            devlog(
                '\x1b[32mexit\x1b[37m  - ' +
                    uid +
                    ' - ' +
                    JSON.stringify(setConvertObject(pool), undefined, 4)
            );
        });

        socket.on('send', async (msg) => {
            const [time, threadId, data]: string[] = msg.split('#');
            devlog('\x1b[32msend\x1b[37m  - ' + threadId + ' - ' + data);
            const thread = prisma.thread.findUnique({
                where: { id: threadId },
            });
            //@ts-expect-error
            const fromId: string = socket.user;
            const buffer = dataURLToBuffer(data);
            await prisma.message.create({
                data: {
                    threadId,
                    fromId,
                    type: buffer.mime,
                    encoding: buffer.encoding,
                    data: buffer.buffer,
                    createdAt: unepoch(parseFloat(time)),
                },
            });
            const from = await prisma.user.findUnique({
                where: { id: fromId },
            });
            const fwd = `${time}#${threadId}#${from?.image}#${from?.name}#${from?.id}#${data}`;
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

            await prisma.thread.create({
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

        socket.on('get', async (msg) => {
            const [id, skip, take]: string[] = msg.split('#');
            const data = await prisma.thread.findUnique({
                where: { id },
                select: {
                    Messages: {
                        skip: parseInt(skip),
                        take: parseInt(take),
                        select: {
                            id: true,
                            threadId: true,
                            type: true,
                            encoding: true,
                            data: true,
                            createdAt: true,
                            from: {
                                select: {
                                    name: true,
                                    id: true,
                                    image: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            });
            console.log(
                data?.Messages.map((message) => ({
                    id: message.id,
                    threadId: message.threadId,
                    from: message.from,
                    data: bufferToDataURL({
                        mime: message.type,
                        encoding: message.encoding,
                        buffer: message.data,
                    }),
                    createdAt: epoch(message.createdAt),
                }))
            );
            socket.emit('rec', `${id}#${skip}#`);
        });

        socket.emit('handshake');
    });

    server.listen(port, () => {
        console.log(
            '\x1b[32mready\x1b[37m - started server on 0.0.0.0:' +
                port.toString() +
                ', url: http://localhost:' +
                port.toString()
        );
    });
});
