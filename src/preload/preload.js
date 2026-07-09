const { contextBridge, ipcRenderer } = require('electron');

// ============================================
// API QUẢN LÝ CÔNG TY & DANH MỤC
// ============================================
const companyAPI = {
    getCompanyData: () => ipcRenderer.invoke('companies:getData'),
    addCompany: (data) => ipcRenderer.invoke('companies:addCompany', data),
    deleteCompany: (id) => ipcRenderer.invoke('companies:deleteCompany', id),
    addCategory: (data) => ipcRenderer.invoke('companies:addCategory', data),
};

// ============================================
// API QUẢN LÝ HỒ SƠ & VIỆC CON
// ============================================
const taskAPI = {
    getAllTasks: () => ipcRenderer.invoke('tasks:getAll'),
    saveTask: (payload) => ipcRenderer.invoke('tasks:save', payload),
    deleteTask: (id) => ipcRenderer.invoke('tasks:delete', id),
    quickCompleteTask: (id) => ipcRenderer.invoke('tasks:quickComplete', id)
};

// ============================================
// API QUẢN LÝ NHÀ CUNG CẤP (VENDORS)
// ============================================
const vendorAPI = {
    getAll: (companyId) => ipcRenderer.invoke('vendors:getAll', companyId),
    getById: (vendorId) => ipcRenderer.invoke('vendors:getById', vendorId),
    add: (data) => ipcRenderer.invoke('vendors:add', data),
    update: (id, data) => ipcRenderer.invoke('vendors:update', id, data),
    delete: (vendorId) => ipcRenderer.invoke('vendors:delete', vendorId),
    search: (companyId, keyword) => ipcRenderer.invoke('vendors:search', companyId, keyword)
};

// ============================================
// API QUẢN LÝ KHÁCH HÀNG (CUSTOMERS)
// ============================================
const customerAPI = {
    getAll: (companyId) => ipcRenderer.invoke('customers:getAll', companyId),
    getById: (customerId) => ipcRenderer.invoke('customers:getById', customerId),
    add: (data) => ipcRenderer.invoke('customers:add', data),
    update: (id, data) => ipcRenderer.invoke('customers:update', id, data),
    delete: (customerId) => ipcRenderer.invoke('customers:delete', customerId),
    search: (companyId, keyword) => ipcRenderer.invoke('customers:search', companyId, keyword)
};

// ============================================
// API QUẢN LÝ MẪU HÓA ĐƠN (INVOICE TEMPLATES)
// ============================================
const invoiceTemplateAPI = {
    getAll: (companyId) => ipcRenderer.invoke('invoiceTemplates:getAll', companyId),
    getById: (templateId) => ipcRenderer.invoke('invoiceTemplates:getById', templateId),
    add: (data) => ipcRenderer.invoke('invoiceTemplates:add', data),
    update: (id, data) => ipcRenderer.invoke('invoiceTemplates:update', id, data),
    delete: (templateId) => ipcRenderer.invoke('invoiceTemplates:delete', templateId),
    generateNextNumber: (templateId) => ipcRenderer.invoke('invoiceTemplates:generateNextNumber', templateId)
};

// ============================================
// API QUẢN LÝ HÓA ĐƠN (INVOICES)
// ============================================
const invoiceAPI = {
    getAll: (companyId, limit = 100, offset = 0) => ipcRenderer.invoke('invoices:getAll', companyId, limit, offset),
    getById: (invoiceId) => ipcRenderer.invoke('invoices:getById', invoiceId),
    create: (data) => ipcRenderer.invoke('invoices:create', data),
    update: (id, data) => ipcRenderer.invoke('invoices:update', id, data),
    delete: (invoiceId) => ipcRenderer.invoke('invoices:delete', invoiceId),
    recordPayment: (invoiceId, paymentData) => ipcRenderer.invoke('invoices:recordPayment', invoiceId, paymentData),
    getOverdue: (companyId) => ipcRenderer.invoke('invoices:getOverdue', companyId),
    getUpcoming: (companyId) => ipcRenderer.invoke('invoices:getUpcoming', companyId),
    getStats: (companyId) => ipcRenderer.invoke('invoices:getStats', companyId),
    search: (companyId, keyword) => ipcRenderer.invoke('invoices:search', companyId, keyword)
};

// ============================================
// EXPOSE ALL APIs TO RENDERER
// ============================================
contextBridge.exposeInMainWorld('electronAPI', {
    companies: companyAPI,
    tasks: taskAPI,
    vendors: vendorAPI,
    customers: customerAPI,
    invoiceTemplates: invoiceTemplateAPI,
    invoices: invoiceAPI
});

console.log('✅ Preload script loaded successfully');
