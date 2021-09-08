import io, { Socket } from 'socket.io-client';

class OpenChatAPI {
    socket: Socket | undefined;
    srv: string | undefined;
    constructor(srv?: string) {
        this.srv = srv;
        this.socket = undefined;
    }

    getToken() {
        const params = this.getUrlVars();
        if (params['token']) {
            window.history.pushState(null, '', window.location.pathname);
            return params['token'];
        } else {
            window.location.href = `${this.srv}/api/thirdparty?callback=${window.location}`;
        }
    }

    connect(token: string) {
        return new Promise<void>((resolve) => {
            if (this.srv) {
                this.socket = io(this.srv);
            } else {
                this.socket = io();
            }

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
                    data[5]
                );
            });

            this.socket.on('data', (msg) => {
                resolve();
            });
        });
    }

    disconnect() {
        this.socket?.disconnect();
    }

    send(time: Date, threadId: string, data: string) {
        this.socket?.emit('send', `${this.epoch(time)}#${threadId}#${data}`);
    }

    onrecieve(
        time: Date,
        threadId: string,
        fromImage: string,
        fromName: string,
        fromId: string,
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
                data,
            }
        );
    }

    getUrlVars() {
        var vars = {};
        window.location.href.replace(
            /[?&]+([^=&]+)=([^&]*)/gi,
            function (m, key, value) {
                vars[key] = value;
                return '';
            }
        );
        return vars;
    }

    textToDataURI(text: string) {
        return `data:text/plain;charset=utf-8;base64,${btoa(text)}`;
    }
    epoch(time?: Date) {
        //@ts-expect-error
        return Math.floor((time ?? new Date()) / 1000);
    }
    unepoch(time: number) {
        return new Date(time * 1000);
    }
}

export default OpenChatAPI;
