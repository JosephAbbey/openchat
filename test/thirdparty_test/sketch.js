// for use with production this should be https://openchat.vercel.app
const ocAPI = new OpenChatAPI('http://localhost:3000');
ocAPI.connect(ocAPI.getToken());

ocAPI.send(
    new Date(),
    'cksrzw6li0006egbe8zuxo9w3',
    'text',
    ocAPI.textToDataURI('hello world')
);
