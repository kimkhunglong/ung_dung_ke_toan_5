const invoiceTemplateService = require('../services/invoiceTemplateService');

function initInvoiceTemplateController(ipcMain) {
    /**
     * Lấy tất cả mẫu hóa đơn
     */
    ipcMain.handle('invoiceTemplates:getAll', async (event, companyId) => {
        return invoiceTemplateService.getAllTemplates(companyId);
    });

    /**
     * Lấy chi tiết mẫu hóa đơn
     */
    ipcMain.handle('invoiceTemplates:getById', async (event, templateId) => {
        return invoiceTemplateService.getTemplateById(templateId);
    });

    /**
     * Thêm mẫu hóa đơn mới
     */
    ipcMain.handle('invoiceTemplates:add', async (event, data) => {
        return invoiceTemplateService.addTemplate(data);
    });

    /**
     * Cập nhật mẫu hóa đơn
     */
    ipcMain.handle('invoiceTemplates:update', async (event, id, data) => {
        return invoiceTemplateService.updateTemplate(id, data);
    });

    /**
     * Xóa mẫu hóa đơn
     */
    ipcMain.handle('invoiceTemplates:delete', async (event, templateId) => {
        return invoiceTemplateService.deleteTemplate(templateId);
    });

    /**
     * Tạo số hóa đơn tiếp theo
     */
    ipcMain.handle('invoiceTemplates:generateNextNumber', async (event, templateId) => {
        return invoiceTemplateService.generateNextInvoiceNumber(templateId);
    });
}

module.exports = initInvoiceTemplateController;
