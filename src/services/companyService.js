const companyRepository = require('../repositories/companyRepository');
const { generateId, createResponse } = require('../utils/helpers');

class CompanyService {
    getCompanyData() {
        try {
            const companies = companyRepository.getAllCompanies();
            const categories = companyRepository.getAllCategories();
            
            // Trả về dữ liệu đóng gói cho View
            return createResponse(true, { companies, categories });
        } catch (error) {
            console.error('Lỗi CompanyService.getCompanyData:', error);
            return createResponse(false, null, 'Không thể tải dữ liệu danh mục công ty.');
        }
    }

    addCompany(data) {
        try {
            if (!data.name || data.name.trim() === '') {
                return createResponse(false, null, 'Tên công ty không được để trống.');
            }

            const newCompany = {
                id: generateId('comp'),
                name: data.name.trim().toUpperCase(),
                tax_code: data.tax_code || null,
                address: data.address || null
            };

            const result = companyRepository.createCompany(newCompany);
            return createResponse(true, result, 'Thêm công ty thành công.');
        } catch (error) {
            console.error('Lỗi CompanyService.addCompany:', error);
            return createResponse(false, null, 'Đã xảy ra lỗi khi lưu công ty.');
        }
    }

    addCategory(data) {
        try {
            if (!data.name || !data.company_id) {
                return createResponse(false, null, 'Dữ liệu hạng mục không hợp lệ.');
            }

            const newCategory = {
                id: generateId('cat'),
                company_id: data.company_id,
                name: data.name.trim()
            };

            const result = companyRepository.createCategory(newCategory);
            return createResponse(true, result, 'Thêm hạng mục thành công.');
        } catch (error) {
            console.error('Lỗi CompanyService.addCategory:', error);
            return createResponse(false, null, 'Đã xảy ra lỗi khi lưu hạng mục.');
        }
    }

    deleteCompany(id) {
        try {
            if (!id) return createResponse(false, null, 'ID công ty không hợp lệ.');
            // Lưu ý: Cần thêm logic kiểm tra xem công ty có đang chứa task không trước khi xóa (sẽ nâng cấp sau ở bản ERP)
            companyRepository.softDeleteCompany(id);
            return createResponse(true, null, 'Đã xóa công ty.');
        } catch (error) {
            console.error('Lỗi CompanyService.deleteCompany:', error);
            return createResponse(false, null, 'Lỗi hệ thống khi xóa công ty.');
        }
    }
}

module.exports = new CompanyService();