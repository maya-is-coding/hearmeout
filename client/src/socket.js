import { io } from 'socket.io-client';

const socket = io('https://hearmeout-omw3.onrender.com', {
    transports: ['websocket']
});

export default socket;
