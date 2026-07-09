const taskService = require('../services/taskService');

function initTaskController(ipcMain) {
    ipcMain.handle('tasks:getAll', async (event) => {
        return taskService.getTasks();
    });

    ipcMain.handle('tasks:save', async (event, payload) => {
        return taskService.saveTask(payload);
    });

    ipcMain.handle('tasks:delete', async (event, id) => {
        return taskService.deleteTask(id);
    });

    ipcMain.handle('tasks:quickComplete', async (event, id) => {
        return taskService.quickComplete(id);
    });
}

module.exports = initTaskController;