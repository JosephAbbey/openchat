// dev
// const ocAPI = new OpenChatAPI('http://localhost:3000');
// production
const ocAPI = new OpenChatAPI('https://openchat.vercel.app');
ocAPI.connect(ocAPI.getToken());

ocAPI.send(
    new Date(),
    'cksrzw6li0006egbe8zuxo9w3',
    'text',
    ocAPI.textToDataURI('hello world')
);
