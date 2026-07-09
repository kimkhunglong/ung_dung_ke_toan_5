const taskRepository = require('../repositories/taskRepository');
const { generateId, createResponse } = require('../utils/helpers');

class TaskService {
    getTasks() {
        try {
            const tasks = taskRepository.getAllTasks();
            return createResponse(true, tasks);
        } catch (error) {
            console.error('Lỗi TaskService.getTasks:', error);
            return createResponse(false, null, 'Lỗi khi tải danh sách hồ sơ.');
        }
    }

    saveTask(payload) {
        try {
            // Validation cơ bản
            if (!payload.title || !payload.company_id || !payload.category_id) {
                return createResponse(false, null, 'Vui lòng điền đủ các thông tin bắt buộc.');
            }

            const isNew = !payload.id;
            const taskId = isNew ? generateId('task') : payload.id;

            const taskData = {
                id: taskId,
                company_id: payload.company_id,
                category_id: payload.category_id,
                title: payload.title.trim(),
                amount: Number(payload.amount) || 0,
                due_date: payload.due_date || null,
                priority: payload.priority || 'Trung bình',
                invoice_status: payload.invoice_status || 'Chưa có Hóa đơn / Tờ trình',
                contractor: payload.contractor || '',
                notes: payload.notes || '',
                status: payload.status || 'pending'
            };

            // Tiền xử lý ID cho việc con nếu là việc con mới
            const subtasks = (payload.subtasks || []).map(sub => ({
                id: sub.id && sub.id.startsWith('sub-') ? sub.id : generateId('sub'),
                text: sub.text,
                completed: sub.completed
            }));

            taskRepository.saveTaskWithSubtasks(taskData, subtasks);
            
            return createResponse(true, taskData, isNew ? 'Tạo hồ sơ thành công.' : 'Cập nhật hồ sơ thành công.');
        } catch (error) {
            console.error('Lỗi TaskService.saveTask:', error);
            return createResponse(false, null, 'Đã xảy ra lỗi khi lưu hồ sơ.');
        }
    }

    deleteTask(id) {
        try {
            if (!id) return createResponse(false, null, 'ID không hợp lệ.');
            taskRepository.softDeleteTask(id);
            return createResponse(true, null, 'Đã xóa hồ sơ.');
        } catch (error) {
            console.error('Lỗi TaskService.deleteTask:', error);
            return createResponse(false, null, 'Đã xảy ra lỗi khi xóa hồ sơ.');
        }
    }

    quickComplete(id) {
        try {
            taskRepository.updateTaskStatus(id, 'completed');
            return createResponse(true, null, 'Đã hoàn tất hồ sơ.');
        } catch (error) {
            console.error('Lỗi TaskService.quickComplete:', error);
            return createResponse(false, null, 'Không thể cập nhật trạng thái.');
        }
    }
}

module.exports = new TaskService();