const { db } = require('../database/db');

class TaskRepository {
    getAllTasks() {
        const stmt = db.prepare(`SELECT * FROM tasks WHERE deleted = 0 ORDER BY due_date ASC`);
        const tasks = stmt.all();
        
        // Lấy toàn bộ subtasks
        const subStmt = db.prepare(`SELECT * FROM subtasks WHERE deleted = 0`);
        const allSubtasks = subStmt.all();

        // Map subtasks vào đúng task của nó
        tasks.forEach(task => {
            task.subtasks = allSubtasks.filter(sub => sub.task_id === task.id);
        });

        return tasks;
    }

    saveTaskWithSubtasks(task, subtasks) {
        // Sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu
        const transaction = db.transaction((t, subs) => {
            // 1. Kiểm tra xem task đã tồn tại chưa (Upsert logic)
            const checkStmt = db.prepare(`SELECT id FROM tasks WHERE id = ?`);
            const exists = checkStmt.get(t.id);

            if (exists) {
                // Update
                const updateTaskStmt = db.prepare(`
                    UPDATE tasks SET 
                        title = @title, company_id = @company_id, category_id = @category_id, 
                        amount = @amount, due_date = @due_date, priority = @priority, 
                        invoice_status = @invoice_status, contractor = @contractor, 
                        notes = @notes, status = @status, updated_at = CURRENT_TIMESTAMP
                    WHERE id = @id
                `);
                updateTaskStmt.run(t);
                
                // Xóa mềm subtasks cũ để insert lại (Cách đơn giản cho bản local)
                const deleteSubsStmt = db.prepare(`UPDATE subtasks SET deleted = 1 WHERE task_id = ?`);
                deleteSubsStmt.run(t.id);
            } else {
                // Insert
                const insertTaskStmt = db.prepare(`
                    INSERT INTO tasks (
                        id, company_id, category_id, title, amount, due_date, 
                        priority, invoice_status, contractor, notes, status, 
                        created_at, updated_at, deleted
                    ) VALUES (
                        @id, @company_id, @category_id, @title, @amount, @due_date, 
                        @priority, @invoice_status, @contractor, @notes, @status, 
                        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0
                    )
                `);
                insertTaskStmt.run(t);
            }

            // 2. Insert Subtasks
            if (subs && subs.length > 0) {
                const insertSubStmt = db.prepare(`
                    INSERT INTO subtasks (id, task_id, text, completed, created_at, updated_at, deleted)
                    VALUES (@id, @task_id, @text, @completed, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
                `);
                for (const sub of subs) {
                    insertSubStmt.run({
                        id: sub.id,
                        task_id: t.id,
                        text: sub.text,
                        completed: sub.completed ? 1 : 0
                    });
                }
            }
        });

        transaction(task, subtasks);
    }

    softDeleteTask(id) {
        const transaction = db.transaction((taskId) => {
            db.prepare(`UPDATE tasks SET deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(taskId);
            db.prepare(`UPDATE subtasks SET deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE task_id = ?`).run(taskId);
        });
        transaction(id);
    }

    updateTaskStatus(id, status) {
        const stmt = db.prepare(`UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
        stmt.run(status, id);
    }
}

module.exports = new TaskRepository();