const companyService = require('../services/companyService');

function initCompanyController(ipcMain) {
    ipcMain.handle('companies:getData', async (event) => {
        return companyService.getCompanyData();
    });

    ipcMain.handle('companies:addCompany', async (event, data) => {
        return companyService.addCompany(data);
    });

    ipcMain.handle('companies:deleteCompany', async (event, id) => {
        return companyService.deleteCompany(id);
    });

    ipcMain.handle('companies:addCategory', async (event, data) => {
        return companyService.addCategory(data);
    });
}

module.exports = initCompanyController;