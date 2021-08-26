class OpenChatAPI {
    constructor(srv) {
        this.srv = srv;
    }

    getToken() {
        const params = this.getUrlVars();
        if (params['token']) {
            return params['token'];
        } else {
            window.location = `${this.srv}/api/thirdparty?callback=${window.location}`;
        }
    }

    connect(token) {
        fetch(`${this.srv}/api/socket`).finally(() => {
            this.socket = io(this.srv);

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
        });
    }

    disconnect() {
        this.socket?.disconnect();
    }

    send(time, threadId, type, data) {
        this.socket?.emit(
            'send',
            `${this.epoch(time)}#${threadId}#${type}#${data}`
        );
    }

    onrecieve(time, threadId, fromImage, fromName, fromId, type, data) {
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

    getUrlVars() {
        var vars = {};
        window.location.href.replace(
            /[?&]+([^=&]+)=([^&]*)/gi,
            function (m, key, value) {
                vars[key] = value;
            }
        );
        return vars;
    }
    textToDataURI(text) {
        return `data:text/plain;charset=utf-8;base64,${btoa(text)}`;
    }
    epoch(time) {
        return Math.floor((time ?? new Date()) / 1000);
    }
    unepoch(time) {
        return new Date(time * 1000);
    }
}
