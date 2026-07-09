const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Auth
    login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
    
    // Companies
    getCompanies: () => ipcRenderer.invoke('companies:getAll'),
    addCompany: (data) => ipcRenderer.invoke('companies:add', data),
    
    // Tasks
    getTasks: (filters) => ipcRenderer.invoke('tasks:get', filters),
    saveTask: (taskData) => ipcRenderer.invoke('tasks:save', taskData),
    deleteTask: (taskId) => ipcRenderer.invoke('tasks:delete', taskId),
    
    // System
    exportData: (format) => ipcRenderer.invoke('system:export', format)
});
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // API Pháp nhân Công ty & Hạng mục nghiệp vụ
    getCompanyData: () => ipcRenderer.invoke('companies:getData'),
    addCompany: (data) => ipcRenderer.invoke('companies:addCompany', data),
    deleteCompany: (id) => ipcRenderer.invoke('companies:deleteCompany', id),
    addCategory: (data) => ipcRenderer.invoke('companies:addCategory', data),

    // API Hồ sơ & Các bước xử lý con (Subtasks)
    getAllTasks: () => ipcRenderer.invoke('tasks:getAll'),
    saveTask: (payload) => ipcRenderer.invoke('tasks:save', payload),
    deleteTask: (id) => ipcRenderer.invoke('tasks:delete', id),
    quickCompleteTask: (id) => ipcRenderer.invoke('tasks:quickComplete', id)
});
const { contextBridge, ipcRenderer } = require('electron');

// Lộ diện các hàm kết nối database ra môi trường giao diện (Renderer Process)
contextBridge.exposeInMainWorld('electronAPI', {
    getCompaniesData: () => ipcRenderer.invoke('companies:getData'),
    addCompany: (data) => ipcRenderer.invoke('companies:addCompany', data),
    deleteCompany: (id) => ipcRenderer.invoke('companies:deleteCompany', id),
    addCategory: (data) => ipcRenderer.invoke('companies:addCategory', data),
    getAllTasks: () => ipcRenderer.invoke('tasks:getAll'),
    saveTask: (payload) => ipcRenderer.invoke('tasks:save', payload),
    deleteTask: (id) => ipcRenderer.invoke('tasks:delete', id),
    quickCompleteTask: (id) => ipcRenderer.invoke('tasks:quickComplete', id)
});
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getInitialData: () => ipcRenderer.invoke('db:get-all'),
    addCompany: (companyName) => ipcRenderer.invoke('db:add-company', companyName),
    // ... các hàm khác
});