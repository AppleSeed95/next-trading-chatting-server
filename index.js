const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const { messageCtr, reloadCtr } = require('./controller');
const { watchDatabase } = require('./databaseWatcher');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(morgan('dev'))
const server = http.createServer(app);

const io = require('socket.io').listen(server)

io.on('connection', (socket) => {
    socket.on('message', (data) => {
        messageCtr(io, data);
    });
    socket.on('requireReload', (data) => {
        reloadCtr(io, data);
    });
    socket.on('info', (data) => {
        socket.join(data.roomId);
    })
    socket.on('leave', (data) => {
        socket.leave(data.roomId);
    })
    socket.on('disconnect', () => {
    });
});

// Your other API routes and middleware can be defined here
// setInterval(() => {
//     watchDatabase();
// }, 3000);
const port = process.env.PORT || 5000;

server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});