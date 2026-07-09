const crypto = require('crypto');

/**
 * Tạo ID ngẫu nhiên không trùng lặp cho các Record trong DB
 * @param {string} prefix - Tiền tố của ID (vd: 'comp', 'task')
 * @returns {string} ID đã được tạo
 */
function generateId(prefix = 'id') {
    const uuid = crypto.randomUUID().split('-')[0];
    const timestamp = Date.now().toString(36);
    return `${prefix}-${timestamp}-${uuid}`;
}

/**
 * Chuẩn hóa cấu trúc dữ liệu trả về cho Renderer (IPC Response)
 * @param {boolean} success - Trạng thái thành công
 * @param {any} data - Dữ liệu trả về (nếu có)
 * @param {string} message - Thông báo lỗi hoặc thành công
 * @returns {object}
 */
function createResponse(success, data = null, message = '') {
    return {
        success,
        data,
        message
    };
}

module.exports = {
    generateId,
    createResponse
};