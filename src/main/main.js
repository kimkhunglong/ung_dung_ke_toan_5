const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs'); // Thêm thư viện quản lý file của Node.js


// Khởi tạo hoặc kết nối tới file cơ sở dữ liệu SQLite cục bộ
const dbPath = path.join(app.getPath('userData'), 'ke_toan_database.db');
const db = new Database(dbPath, { verbose: console.log });

// Kích hoạt tính năng khóa ngoại (Foreign Keys) để ràng buộc dữ liệu các bảng
db.pragma('foreign_keys = ON');

// Đảm bảo cấu trúc các bảng CSDL luôn được khởi tạo đầy đủ
function initDatabaseSchema() {
    // 1. Tạo các bảng cơ bản nếu chưa có (Giống y như cũ)
    db.prepare(`CREATE TABLE IF NOT EXISTS companies (id TEXT PRIMARY KEY, name TEXT NOT NULL)`).run();
    db.prepare(`CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, company_id TEXT)`).run();
    // ... các lệnh tạo bảng tasks và subtasks của bạn ...

    // 2. KIỂM TRA PHIÊN BẢN CƠ SỞ DỮ LIỆU HIỆN TẠI
    // Mặc định ban đầu database mới tạo sẽ có user_version = 0
    let currentDbVersion = db.pragma('user_version', { simple: true });

    // NÂNG CẤP LÊN PHIÊN BẢN 2 (Ví dụ: Thêm cột Mã số thuế cho công ty)
    if (currentDbVersion < 2) {
        try {
            // Thực hiện câu lệnh cập nhật cấu trúc bảng (ALTER TABLE)
            db.prepare("ALTER TABLE companies ADD COLUMN tax_code TEXT DEFAULT ''").run();
            
            // Cập nhật số phiên bản DB lên 2 để lần sau không chạy lại đoạn này nữa
            db.pragma('user_version = 2');
            console.log("Đã nâng cấp cấu trúc Database lên phiên bản 2 thành công!");
        } catch (err) {
            console.log("Cột tax_code đã tồn tại hoặc có lỗi:", err.message);
        }
    }

    // NÂNG CẤP LÊN PHIÊN BẢN 3 (Nếu tương lai bạn có thêm tính năng mới)
    // if (currentDbVersion < 3) { 
    //     db.prepare("ALTER TABLE tasks ADD COLUMN created_by TEXT").run();
    //     db.pragma('user_version = 3');
    // }
}

function createWindow () {
    const mainWindow = new BrowserWindow({
        width: 1300,
        height: 850,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    // Bỏ chú thích nếu cần debug lỗi giao diện Console:
    // mainWindow.webContents.openDevTools();
}

// Lắng nghe và điều phối luồng dữ liệu thông qua cổng Async IPC
app.whenReady().then(() => {

    autoBackupDatabase();

    initDatabaseSchema();

    // tất cả ipcMain.handle(...)

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });

});

    // 2. Thêm mới công ty
    ipcMain.handle('companies:addCompany', async (event, data) => {
        try {
            const newId = 'c-' + Date.now();
            db.prepare("INSERT INTO companies (id, name) VALUES (?, ?)").run(newId, data.name);
            return { success: true, data: { id: newId, name: data.name } };
        } catch (error) {
            return { success: false, message: "Lỗi thêm công ty: " + error.message };
        }
    });

    // 3. Xóa công ty (Tự động xóa sạch hạng mục & hồ sơ đi kèm nhờ ON DELETE CASCADE)
    ipcMain.handle('companies:deleteCompany', async (event, id) => {
        try {
            db.prepare("DELETE FROM companies WHERE id = ?").run(id);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    // 4. Thêm mới Hạng mục nghiệp vụ
    ipcMain.handle('companies:addCategory', async (event, data) => {
        try {
            const newId = 'cat-' + Date.now();
            db.prepare("INSERT INTO categories (id, name, company_id) VALUES (?, ?, ?)")
              .run(newId, data.name, data.company_id);
            return { success: true, data: { id: newId, name: data.name, company_id: data.company_id } };
        } catch (error) {
            return { success: false, message: "Lỗi thêm hạng mục: " + error.message };
        }
    });

    // 5. Lấy toàn bộ danh sách hồ sơ kèm mảng việc con (Subtasks) lồng bên trong
    ipcMain.handle('tasks:getAll', async () => {
        try {
            const tasks = db.prepare("SELECT * FROM tasks").all();
            const subtasks = db.prepare("SELECT * FROM subtasks").all();

            // Nhóm gọn các việc con vào đúng hồ sơ cha của nó trước khi gửi lên giao diện
            const taskMap = tasks.map(t => {
                t.subtasks = subtasks.filter(s => s.task_id === t.id);
                return t;
            });
            return { success: true, data: taskMap };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    // 6. Lưu hồ sơ (Sử dụng TRANSACTION để đảm bảo cập nhật đồng thời cả bảng cha và bảng con)
    ipcMain.handle('tasks:save', async (event, payload) => {
        const executeTransaction = db.transaction((task) => {
            let taskId = task.id;
            
            if (taskId) {
                // Trường hợp: Cập nhật hồ sơ hiện hành
                db.prepare(`
                    UPDATE tasks SET 
                        title = ?, company_id = ?, category_id = ?, amount = ?, 
                        due_date = ?, priority = ?, invoice_status = ?, contractor = ?, 
                        notes = ?, status = ? 
                    WHERE id = ?
                `).run(
                    task.title, task.company_id, task.category_id, task.amount,
                    task.due_date, task.priority, task.invoice_status, task.contractor,
                    task.notes, task.status, taskId
                );
            } else {
                // Trường hợp: Thêm mới hồ sơ
                taskId = 't-' + Date.now();
                db.prepare(`
                    INSERT INTO tasks (id, title, company_id, category_id, amount, due_date, priority, invoice_status, contractor, notes, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    taskId, task.title, task.company_id, task.category_id, task.amount,
                    task.due_date, task.priority, task.invoice_status, task.contractor,
                    task.notes, task.status
                );
            }

            // Đồng bộ danh sách công việc con (Xóa danh sách việc con cũ, chèn lại danh sách mới nhất)
            db.prepare("DELETE FROM subtasks WHERE task_id = ?").run(taskId);
            if (task.subtasks && task.subtasks.length > 0) {
                const insertSubtask = db.prepare("INSERT INTO subtasks (id, task_id, text, completed) VALUES (?, ?, ?, ?)");
                for (const sub of task.subtasks) {
                    const subId = sub.id && sub.id.startsWith('sub-') ? sub.id : 'sub-' + Math.random().toString(36).substr(2, 9);
                    insertSubtask.run(subId, taskId, sub.text, sub.completed);
                }
            }
            return true;
        });

        try {
            executeTransaction(payload);
            return { success: true };
        } catch (error) {
            return { success: false, message: "Lỗi lưu cơ sở dữ liệu: " + error.message };
        }
    });

    // 7. Xóa hồ sơ việc
    ipcMain.handle('tasks:delete', async (event, id) => {
        try {
            db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    // 8. Duyệt nhanh trạng thái hoàn tất hồ sơ
    ipcMain.handle('tasks:quickComplete', async (event, id) => {
        try {
            db.prepare("UPDATE tasks SET status = 'completed' WHERE id = ?").run(id);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });



    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });


app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// --- HÀM TỰ ĐỘNG SAO LƯU DỮ LIỆU ---
function autoBackupDatabase() {
    try {
        // Tạo thư mục "backups" nằm bên cạnh file database chính
        const backupFolder = path.join(app.getPath('userData'), 'backups');
        if (!fs.existsSync(backupFolder)) {
            fs.mkdirSync(backupFolder, { recursive: true });
        }

        // Đặt tên file theo ngày hiện tại (Ví dụ: backup_2026-07-09.db)
        const todayStr = new Date().toISOString().slice(0, 10);
        const backupPath = path.join(backupFolder, `backup_${todayStr}.db`);

        // Nếu hôm nay chưa sao lưu thì tiến hành copy file
        if (!fs.existsSync(backupPath)) {
            fs.copyFileSync(dbPath, backupPath);
            console.log('Đã tự động sao lưu dữ liệu tại:', backupPath);
        }
    } catch (error) {
        console.error('Lỗi sao lưu dữ liệu:', error.message);
    }
}

// Gọi hàm này ngay khi ứng dụng sẵn sàng


ipcMain.handle('db:add-company', async (event, companyName) => {
    const id = 'comp-' + Date.now();
    const nameUpper = companyName.toUpperCase();
    db.prepare("INSERT INTO companies (id, name) VALUES (?, ?)").run(id, nameUpper);
    return { id, name: nameUpper };
});