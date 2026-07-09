const { db } = require('../database/db');

class CompanyRepository {
    /**
     * Lấy toàn bộ danh sách công ty chưa bị xóa (Soft Delete)
     */
    getAllCompanies() {
        const stmt = db.prepare(`SELECT * FROM companies WHERE deleted = 0 ORDER BY created_at DESC`);
        return stmt.all();
    }

    /**
     * Thêm mới một công ty
     */
    createCompany(company) {
        const stmt = db.prepare(`
            INSERT INTO companies (id, name, tax_code, address, created_at, updated_at, deleted)
            VALUES (@id, @name, @tax_code, @address, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
        `);
        stmt.run(company);
        return company;
    }

    /**
     * Xóa mềm công ty (Soft Delete)
     */
    softDeleteCompany(id) {
        const stmt = db.prepare(`UPDATE companies SET deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
        return stmt.run(id);
    }

    // ==========================================
    // QUẢN LÝ HẠNG MỤC (CATEGORIES) CỦA CÔNG TY
    // ==========================================

    getAllCategories() {
        const stmt = db.prepare(`SELECT * FROM categories WHERE deleted = 0 ORDER BY created_at ASC`);
        return stmt.all();
    }

    createCategory(category) {
        const stmt = db.prepare(`
            INSERT INTO categories (id, company_id, name, created_at, updated_at, deleted)
            VALUES (@id, @company_id, @name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
        `);
        stmt.run(category);
        return category;
    }

    softDeleteCategory(id) {
        const stmt = db.prepare(`UPDATE categories SET deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
        return stmt.run(id);
    }
}

module.exports = new CompanyRepository();