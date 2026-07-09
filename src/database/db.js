const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const { createTables } = require('./schema');

// Khởi tạo Database trong thư mục userData của OS để dữ liệu không bị mất khi update app
const dbPath = path.join(app.getPath('userData'), 'accounting.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Hàm khởi tạo các bảng
function initDB() {
    try {
        db.exec(createTables);
        console.log('Khởi tạo cơ sở dữ liệu thành công tại:', dbPath);
    } catch (error) {
        console.error('Lỗi khi khởi tạo CSDL:', error);
        throw error;
    }
}

module.exports = {
    db,
    initDB
};