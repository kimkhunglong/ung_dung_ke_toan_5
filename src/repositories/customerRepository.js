const { db } = require('../database/db');

class CustomerRepository {
    /**
     * Lấy tất cả khách hàng của công ty
     */
    getAllCustomers(companyId) {
        const stmt = db.prepare(`
            SELECT * FROM customers 
            WHERE company_id = ? AND deleted = 0 
            ORDER BY created_at DESC
        `);
        return stmt.all(companyId);
    }

    /**
     * Lấy khách hàng theo ID
     */
    getCustomerById(id) {
        const stmt = db.prepare(`
            SELECT * FROM customers 
            WHERE id = ? AND deleted = 0
        `);
        return stmt.get(id);
    }

    /**
     * Tạo khách hàng mới
     */
    createCustomer(customer) {
        const stmt = db.prepare(`
            INSERT INTO customers (id, company_id, name, tax_code, email, phone, address, bank_account, bank_name, created_at, updated_at, deleted)
            VALUES (@id, @company_id, @name, @tax_code, @email, @phone, @address, @bank_account, @bank_name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
        `);
        stmt.run(customer);
        return customer;
    }

    /**
     * Cập nhật khách hàng
     */
    updateCustomer(id, customer) {
        const stmt = db.prepare(`
            UPDATE customers 
            SET name = @name, tax_code = @tax_code, email = @email, phone = @phone, 
                address = @address, bank_account = @bank_account, bank_name = @bank_name,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @id
        `);
        return stmt.run({
            id,
            name: customer.name,
            tax_code: customer.tax_code,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            bank_account: customer.bank_account,
            bank_name: customer.bank_name
        });
    }

    /**
     * Xóa mềm khách hàng
     */
    softDeleteCustomer(id) {
        const stmt = db.prepare(`
            UPDATE customers 
            SET deleted = 1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `);
        return stmt.run(id);
    }

    /**
     * Tìm kiếm khách hàng
     */
    searchCustomers(companyId, keyword) {
        const stmt = db.prepare(`
            SELECT * FROM customers 
            WHERE company_id = ? AND deleted = 0 
            AND (name LIKE ? OR tax_code LIKE ? OR email LIKE ?)
            ORDER BY created_at DESC
        `);
        const searchTerm = `%${keyword}%`;
        return stmt.all(companyId, searchTerm, searchTerm, searchTerm);
    }
}

module.exports = new CustomerRepository();
