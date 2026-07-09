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

/**
 * Format tiền tệ Việt Nam
 * @param {number} amount - Số tiền
 * @returns {string} Tiền tệ định dạng
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

/**
 * Format ngày tháng năm
 * @param {string} date - Ngày cần format
 * @returns {string} Ngày đã format
 */
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
}

/**
 * Tính lại tổng tiền cho invoice item
 * @param {number} quantity - Số lượng
 * @param {number} unitPrice - Đơn giá
 * @param {number} taxRate - Tỷ lệ thuế
 * @returns {object} {amount, taxAmount, lineTotal}
 */
function calculateItemTotal(quantity, unitPrice, taxRate = 10) {
    const amount = quantity * unitPrice;
    const taxAmount = (amount * taxRate) / 100;
    const lineTotal = amount + taxAmount;
    
    return {
        amount: Math.round(amount * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        lineTotal: Math.round(lineTotal * 100) / 100
    };
}

/**
 * Tính lại tổng tiền cho toàn bộ invoice
 * @param {array} items - Mảng các item
 * @returns {object} {totalAmount, totalTaxAmount, grandTotal}
 */
function calculateInvoiceTotal(items = []) {
    let totalAmount = 0;
    let totalTaxAmount = 0;

    items.forEach(item => {
        if (item.deleted === 0) {
            totalAmount += item.amount || 0;
            totalTaxAmount += item.tax_amount || 0;
        }
    });

    const grandTotal = totalAmount + totalTaxAmount;

    return {
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
        grandTotal: Math.round(grandTotal * 100) / 100
    };
}

/**
 * Kiểm tra xem hóa đơn có quá hạn không
 * @param {string} dueDate - Ngày hạn thanh toán
 * @returns {boolean}
 */
function isInvoiceOverdue(dueDate) {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
}

/**
 * Kiểm tra xem hóa đơn sắp đến hạn (trong 7 ngày)
 * @param {string} dueDate - Ngày hạn thanh toán
 * @returns {boolean}
 */
function isInvoiceDueSoon(dueDate) {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 && diffDays <= 7;
}

/**
 * Tính số ngày thanh toán còn lại hoặc quá hạn
 * @param {string} dueDate - Ngày hạn thanh toán
 * @returns {number} Số ngày (âm nếu quá hạn)
 */
function calculateDaysRemaining(dueDate) {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Tạo số hóa đơn theo pattern
 * @param {object} template - Template hóa đơn
 * @returns {string} Số hóa đơn
 */
function generateInvoiceNumber(template) {
    if (!template || !template.format_pattern) {
        return `INV-${Date.now()}`;
    }

    const pattern = template.format_pattern;
    const year = new Date().getFullYear();
    const nextNumber = template.next_number || 1;
    
    let invoiceNumber = pattern
        .replace('{YEAR}', year)
        .replace('{NUMBER:06d}', String(nextNumber).padStart(6, '0'));
    
    return invoiceNumber;
}

/**
 * Validate email
 * @param {string} email - Email cần validate
 * @returns {boolean}
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate số điện thoại
 * @param {string} phone - Số điện thoại
 * @returns {boolean}
 */
function validatePhone(phone) {
    const re = /^(\+84|0)[1-9]\d{8,9}$/;
    return re.test(phone);
}

module.exports = {
    generateId,
    createResponse,
    formatCurrency,
    formatDate,
    calculateItemTotal,
    calculateInvoiceTotal,
    isInvoiceOverdue,
    isInvoiceDueSoon,
    calculateDaysRemaining,
    generateInvoiceNumber,
    validateEmail,
    validatePhone
};
