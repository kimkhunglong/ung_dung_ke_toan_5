const invoiceTemplateRepository = require('../repositories/invoiceTemplateRepository');
const { generateId, createResponse, generateInvoiceNumber } = require('../utils/helpers');

class InvoiceTemplateService {
    /**
     * Lấy tất cả template hóa đơn
     */
    getAllTemplates(companyId) {
        try {
            const templates = invoiceTemplateRepository.getAllTemplates(companyId);
            return createResponse(true, templates, 'Tải danh sách mẫu hóa đơn thành công.');
        } catch (error) {
            console.error('Lỗi InvoiceTemplateService.getAllTemplates:', error);
            return createResponse(false, null, 'Lỗi khi tải danh sách mẫu hóa đơn.');
        }
    }

    /**
     * Lấy chi tiết template
     */
    getTemplateById(id) {
        try {
            const template = invoiceTemplateRepository.getTemplateById(id);
            if (!template) {
                return createResponse(false, null, 'Mẫu hóa đơn không tồn tại.');
            }
            return createResponse(true, template);
        } catch (error) {
            console.error('Lỗi InvoiceTemplateService.getTemplateById:', error);
            return createResponse(false, null, 'Lỗi khi lấy thông tin mẫu hóa đơn.');
        }
    }

    /**
     * Thêm mẫu hóa đơn mới
     */
    addTemplate(data) {
        try {
            if (!data.name || data.name.trim() === '') {
                return createResponse(false, null, 'Tên mẫu hóa đơn không được để trống.');
            }

            if (!data.invoice_series || data.invoice_series.trim() === '') {
                return createResponse(false, null, 'Chuỗi hóa đơn không được để trống.');
            }

            if (!data.company_id) {
                return createResponse(false, null, 'Công ty không hợp lệ.');
            }

            const template = {
                id: generateId('template'),
                company_id: data.company_id,
                name: data.name.trim(),
                invoice_series: data.invoice_series.trim(),
                next_number: data.next_number || 1,
                format_pattern: data.format_pattern || 'HD-{YEAR}-{NUMBER:06d}',
                header_text: data.header_text || null,
                footer_text: data.footer_text || null
            };

            const result = invoiceTemplateRepository.createTemplate(template);
            return createResponse(true, result, 'Thêm mẫu hóa đơn thành công.');
        } catch (error) {
            console.error('Lỗi InvoiceTemplateService.addTemplate:', error);
            return createResponse(false, null, 'Lỗi khi thêm mẫu hóa đơn.');
        }
    }

    /**
     * Cập nhật mẫu hóa đơn
     */
    updateTemplate(id, data) {
        try {
            if (!data.name || data.name.trim() === '') {
                return createResponse(false, null, 'Tên mẫu hóa đơn không được để trống.');
            }

            if (!data.invoice_series || data.invoice_series.trim() === '') {
                return createResponse(false, null, 'Chuỗi hóa đơn không được để trống.');
            }

            const template = {
                name: data.name.trim(),
                invoice_series: data.invoice_series.trim(),
                next_number: data.next_number || 1,
                format_pattern: data.format_pattern || 'HD-{YEAR}-{NUMBER:06d}',
                header_text: data.header_text || null,
                footer_text: data.footer_text || null
            };

            invoiceTemplateRepository.updateTemplate(id, template);
            return createResponse(true, null, 'Cập nhật mẫu hóa đơn thành công.');
        } catch (error) {
            console.error('Lỗi InvoiceTemplateService.updateTemplate:', error);
            return createResponse(false, null, 'Lỗi khi cập nhật mẫu hóa đơn.');
        }
    }

    /**
     * Xóa mẫu hóa đơn
     */
    deleteTemplate(id) {
        try {
            invoiceTemplateRepository.softDeleteTemplate(id);
            return createResponse(true, null, 'Xóa mẫu hóa đơn thành công.');
        } catch (error) {
            console.error('Lỗi InvoiceTemplateService.deleteTemplate:', error);
            return createResponse(false, null, 'Lỗi khi xóa mẫu hóa đơn.');
        }
    }

    /**
     * Tạo số hóa đơn tiếp theo
     */
    generateNextInvoiceNumber(templateId) {
        try {
            const template = invoiceTemplateRepository.getTemplateById(templateId);
            if (!template) {
                return createResponse(false, null, 'Mẫu hóa đơn không tồn tại.');
            }

            const invoiceNumber = generateInvoiceNumber(template);
            invoiceTemplateRepository.incrementNextNumber(templateId);

            return createResponse(true, { invoiceNumber }, 'Tạo số hóa đơn thành công.');
        } catch (error) {
            console.error('Lỗi InvoiceTemplateService.generateNextInvoiceNumber:', error);
            return createResponse(false, null, 'Lỗi khi tạo số hóa đơn.');
        }
    }
}

module.exports = new InvoiceTemplateService();
