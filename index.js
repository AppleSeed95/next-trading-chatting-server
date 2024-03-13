const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const controller = require('./controller')

const app = express();
app.use(cors());
app.use(morgan('dev'))
const server = http.createServer(app);

const io = require('socket.io').listen(server)
const userChatNamespace = io.of('/user-chat');

userChatNamespace.on('connection', (socket) => {
    socket.on('message', (data) => {
        controller(userChatNamespace, data);
    });
    socket.on('info', (data) => {
        socket.join(data.roomId);
    })
    socket.on('disconnect', () => {
    });
});

// Your other API routes and middleware can be defined here

const port = process.env.PORT || 5000;

server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});