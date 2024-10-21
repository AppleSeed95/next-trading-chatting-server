const mysql = require('mysql');

const password = process.env.DB_PASSWORD ?? 'kAZ5dB4*/x2.|mC2-4Rp'

const db_connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: password,
    database: "project",
});

exports.connection = db_connection;
exports.executeQuery = async (query) => {
    const result = await new Promise((resolve, reject) => {
        db_connection.query(query, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
    return result;
};