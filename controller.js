// const rp = require("request-promise")
const request = require("request-promise");
const config = require('./config')
module.exports = (io, data) => {
    const { roomId, userId, msg } = data;
    const today = new Date();
    const day = `${today.getFullYear()}/${today.getMonth() + 1
        }/${today.getDate()}`;
    const time = `${today.getHours()}:${today.getMinutes()}`
    const options = {
        method: 'POST',
        uri: config.main_url, // Replace with the target server's URL
        body: {
            roomId, userId, msg, day, time
        },
        json: true, // Set to true if you want to send JSON data in the request body
    };
    request(options)
        .then((response) => {
            console.log(response);
            io.to(data.roomId).emit('message'); // Broadcast the message to all connected clients
        })
        .catch((error) => {
            console.log(error);
            io.to(data.roomId).emit('message'); // Broadcast the message to all connected clients
        });
}