import io, { Socket } from 'socket.io-client';

export default class openchatapi {
    socket: Socket | undefined;

    connect(token: string) {
        this.socket = io();

        this.socket.on('handshake', () => {
            if (token && this.socket) {
                this.socket.emit('handshake', token);
            }
        });

        this.socket.on('receive', (msg) => {
            var data = msg.split('#');
            this.onrecieve(
                this.unepoch(parseInt(data[0])),
                data[1],
                data[2],
                data[3],
                data[4],
                data[5],
                data[6]
            );
        });
    }

    disconnect() {
        this.socket?.disconnect();
    }

    send(time: Date, threadId: string, type: string, data: string) {
        this.socket?.emit(
            'send',
            `${this.epoch(time)}#${threadId}#${type}#${data}`
        );
    }

    onrecieve(
        time: Date,
        threadId: string,
        fromImage: string,
        fromName: string,
        fromId: string,
        type: string,
        data: string
    ) {
        console.warn(
            'You have not set an onrecieve listener. Here is the data though: ',
            {
                time,
                threadId,
                fromImage,
                fromName,
                fromId,
                type,
                data,
            }
        );
    }

    textToDataURI(text: string) {
        return `data:text/plain;charset=utf-8;base64,${btoa(text)}`;
    }
    epoch(time?: Date) {
        //@ts-ignore
        return Math.floor((time ?? new Date()) / 1000);
    }
    unepoch(time: number) {
        //@ts-ignore
        return new Date(time * 1000);
    }
}
