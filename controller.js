// const rp = require("request-promise")
const request = require("request-promise");
const config = require('./config')
exports.messageCtr = (io, data) => {
    const { roomId, userId, msg } = data;
    const today = new Date();
    const day = `${today.getFullYear()}/${today.getMonth() + 1
        }/${today.getDate()}`;
    const time = `${today.getHours()}:${today.getMinutes()}`
    const options = {
        method: 'POST',
        uri: config.main_url,
        body: {
            roomId, userId, msg, day, time
        },
        json: true,
    };
    request(options)
        .then((response) => {
            io.to(data.roomId).emit('message');
        })
        .catch((error) => {
            io.to(data.roomId).emit('message');
        });
}
exports.reloadCtr = (io, data) => {
    io.to(data.roomId).emit('requireReload', { data });
}
