# 📊 Hệ Thống Quản Lý Kế Toán - Ứng Dụng Desktop

Ứng dụng Electron toàn diện cho quản lý hóa đơn, nhà cung cấp, khách hàng và các giao dịch kế toán offline.

## 🚀 Tính Năng Chính

### ✅ Quản Lý Công Ty & Danh Mục
- Thêm/Sửa/Xóa công ty
- Quản lý danh mục kế toán
- Lưu trữ tất cả thông tin công ty

### ✅ Quản Lý Hóa Đơn (Mới)
- Tạo hóa đơn từ mẫu tùy chỉnh
- Tính toán VAT tự động
- Theo dõi thanh toán (Pending, Partial, Paid)
- Cảnh báo hóa đơn quá hạn
- Tìm kiếm nhanh hóa đơn

### ✅ Quản Lý Nhà Cung Cấp & Khách Hàng
- Lưu thông tin chi tiết (tên, MST, email, điện thoại)
- Thông tin ngân hàng
- Tìm kiếm nhanh
- Xóa mềm (không mất dữ liệu)

### ✅ Quản Lý Hồ Sơ & Công Việc Con
- CRUD hồ sơ
- Quản lý công việc con (subtasks)
- Thay đổi trạng thái nhanh

### ✅ Sao Lưu Dữ Liệu Tự Động
- Sao lưu hàng ngày
- Lưu trữ trong thư mục userData
- Khôi phục dễ dàng

---

## 📦 Cài Đặt

### Yêu Cầu
- Node.js >= 14.x
- npm >= 6.x
- Windows / macOS / Linux

### Bước 1: Clone Repository
```bash
git clone https://github.com/kimkhunglong/ung_dung_ke_toan_5.git
cd ung_dung_ke_toan_5
```

### Bước 2: Cài Đặt Dependencies
```bash
npm install
```

**Lưu ý:** Nếu gặp lỗi `better-sqlite3`, chạy:
```bash
npm run rebuild
```

### Bước 3: Chạy Ứng Dụng
```bash
npm start
```

### Bước 4: Build Ứng Dụng (Optional)
```bash
npm run dist
```

Tệp cài đặt sẽ được tạo trong thư mục `dist/`

---

## 🏗️ Cấu Trúc Dự Án

```
src/
├── main/
│   └── main.js              # Electron Main Process
├── preload/
│   └── preload.js           # IPC Bridge
├── renderer/
│   ├── index.html           # Giao diện chính
│   └── js/
│       └── invoiceManagement.js
├── database/
│   ├── db.js               # Kết nối Database
│   └── schema.js           # Cấu trúc bảng
├── repositories/
│   ├── vendorRepository.js
│   ├── customerRepository.js
│   ├── invoiceRepository.js
│   ├── invoiceItemRepository.js
│   ├── invoicePaymentRepository.js
│   ├── invoiceTemplateRepository.js
│   ├── companyRepository.js
│   └── taskRepository.js
├── services/
│   ├── vendorService.js
│   ├── customerService.js
│   ├── invoiceService.js
│   ├── invoiceTemplateService.js
│   ├── companyService.js
│   └── taskService.js
├── controllers/
│   ├── vendorController.js
│   ├── customerController.js
│   ├── invoiceController.js
│   ├── invoiceTemplateController.js
│   ├── companyController.js
│   └── taskController.js
└── utils/
    └── helpers.js          # Utility functions
```

---

## 📚 Hướng Dẫn Sử Dụng API

### 1. Quản Lý Nhà Cung Cấp

#### Lấy Tất Cả Nhà Cung Cấp
```javascript
const response = await window.electronAPI.vendors.getAll('company-id');
console.log(response.data); // Mảng nhà cung cấp
```

#### Thêm Nhà Cung Cấp
```javascript
const response = await window.electronAPI.vendors.add({
    company_id: 'comp-123',
    name: 'Công ty ABC',
    tax_code: '0123456789',
    email: 'vendor@example.com',
    phone: '0912345678',
    address: 'Hà Nội',
    bank_account: '123456789',
    bank_name: 'Vietcombank'
});
```

#### Cập Nhật Nhà Cung Cấp
```javascript
await window.electronAPI.vendors.update('vendor-id', {
    name: 'Công ty XYZ',
    email: 'newemail@example.com'
});
```

#### Xóa Nhà Cung Cấp
```javascript
await window.electronAPI.vendors.delete('vendor-id');
```

#### Tìm Kiếm Nhà Cung Cấp
```javascript
const results = await window.electronAPI.vendors.search('company-id', 'ABC');
```

---

### 2. Quản Lý Khách Hàng

Tương tự như nhà cung cấp:
```javascript
// Lấy tất cả
await window.electronAPI.customers.getAll('company-id');

// Thêm
await window.electronAPI.customers.add({
    company_id: 'comp-123',
    name: 'Khách hàng XYZ',
    // ... các trường khác
});

// Cập nhật
await window.electronAPI.customers.update('customer-id', data);

// Xóa
await window.electronAPI.customers.delete('customer-id');

// Tìm kiếm
await window.electronAPI.customers.search('company-id', 'keyword');
```

---

### 3. Quản Lý Mẫu Hóa Đơn

#### Lấy Tất Cả Mẫu
```javascript
const templates = await window.electronAPI.invoiceTemplates.getAll('company-id');
```

#### Thêm Mẫu Hóa Đơn
```javascript
const template = await window.electronAPI.invoiceTemplates.add({
    company_id: 'comp-123',
    name: 'Mẫu hóa đơn 2026',
    invoice_series: 'HD',
    next_number: 1,
    format_pattern: 'HD-{YEAR}-{NUMBER:06d}',
    header_text: 'Công ty TNHH ABC',
    footer_text: 'Cảm ơn quý khách'
});
```

#### Tạo Số Hóa Đơn Tiếp Theo
```javascript
const result = await window.electronAPI.invoiceTemplates.generateNextNumber('template-id');
console.log(result.data.invoiceNumber); // VD: HD-2026-000001
```

---

### 4. Quản Lý Hóa Đơn

#### Lấy Tất Cả Hóa Đơn
```javascript
const response = await window.electronAPI.invoices.getAll('company-id', 100, 0);
// Tham số: (companyId, limit, offset) để phân trang
console.log(response.data);
```

#### Lấy Chi Tiết Hóa Đơn
```javascript
const invoice = await window.electronAPI.invoices.getById('invoice-id');
console.log(invoice.data.items);      // Các mặt hàng
console.log(invoice.data.payments);   // Lịch sử thanh toán
```

#### Tạo Hóa Đơn Mới
```javascript
const response = await window.electronAPI.invoices.create({
    company_id: 'comp-123',
    template_id: 'template-456',
    invoice_date: '2026-07-09',
    due_date: '2026-08-09',
    vendor_id: 'vendor-789',
    customer_id: 'customer-101',
    description: 'Hóa đơn bán hàng',
    tax_rate: 10,
    payment_method: 'bank_transfer',
    created_by: 'user-id',
    items: [
        {
            description: 'Sản phẩm A',
            quantity: 2,
            unit_price: 500000,
            unit: 'cái',
            tax_rate: 10
        },
        {
            description: 'Sản phẩm B',
            quantity: 1,
            unit_price: 1000000,
            unit: 'cái',
            tax_rate: 10
        }
    ]
});

if (response.success) {
    console.log('Hóa đơn được tạo:', response.data.invoice_number);
}
```

#### Cập Nhật Hóa Đơn
```javascript
await window.electronAPI.invoices.update('invoice-id', {
    due_date: '2026-08-15',
    notes: 'Thanh toán nếu có thể'
});
```

#### Xóa Hóa Đơn
```javascript
await window.electronAPI.invoices.delete('invoice-id');
```

#### Ghi Nhận Thanh Toán
```javascript
const response = await window.electronAPI.invoices.recordPayment('invoice-id', {
    amount: 2750000,                    // Số tiền thanh toán
    payment_date: '2026-07-15',         // Ngày thanh toán
    payment_method: 'bank_transfer',    // Phương thức
    reference_number: 'TRANSFER-001',   // Mã tham chiếu
    notes: 'Thanh toán lần 1'
});
```

Hệ thống sẽ tự động cập nhật trạng thái:
- `pending` → Chưa thanh toán
- `partial` → Thanh toán một phần
- `paid` → Đã thanh toán đủ
- `overdue` → Quá hạn

#### Lấy Hóa Đơn Quá Hạn
```javascript
const overdueInvoices = await window.electronAPI.invoices.getOverdue('company-id');
console.log('Số lượng quá hạn:', overdueInvoices.data.length);
```

#### Lấy Hóa Đơn Sắp Đến Hạn
```javascript
const upcomingInvoices = await window.electronAPI.invoices.getUpcoming('company-id');
console.log('Sắp đến hạn trong 7 ngày:', upcomingInvoices.data);
```

#### Lấy Thống Kê Hóa Đơn
```javascript
const stats = await window.electronAPI.invoices.getStats('company-id');
// Kết quả:
// [
//   { payment_status: 'pending', count: 5, total_amount: 50000000, avg_amount: 10000000 },
//   { payment_status: 'paid', count: 20, total_amount: 200000000, avg_amount: 10000000 },
//   ...
// ]
```

#### Tìm Kiếm Hóa Đơn
```javascript
const results = await window.electronAPI.invoices.search('company-id', 'HD-2026-000001');
```

---

## 🔐 Bảng Dữ Liệu

### invoices (Hóa Đơn)
| Trường | Kiểu | Mô Tả |
|--------|------|-------|
| id | TEXT | ID duy nhất |
| invoice_number | TEXT | Số hóa đơn (VD: HD-2026-000001) |
| invoice_date | DATE | Ngày lập hóa đơn |
| due_date | DATE | Ngày hạn thanh toán |
| grand_total | REAL | Tổng tiền (kèm VAT) |
| payment_status | TEXT | pending, partial, paid, overdue, cancelled |
| created_at | DATETIME | Thời gian tạo |

### invoice_items (Chi Tiết Hóa Đơn)
| Trường | Kiểu | Mô Tả |
|--------|------|-------|
| id | TEXT | ID duy nhất |
| invoice_id | TEXT | FK → invoices |
| description | TEXT | Mô tả mặt hàng |
| quantity | REAL | Số lượng |
| unit_price | REAL | Đơn giá |
| line_total | REAL | Thành tiền (kèm VAT) |

### invoice_payments (Ghi Nhận Thanh Toán)
| Trường | Kiểu | Mô Tả |
|--------|------|-------|
| id | TEXT | ID duy nhất |
| invoice_id | TEXT | FK → invoices |
| amount | REAL | Số tiền thanh toán |
| payment_date | DATE | Ngày thanh toán |
| payment_method | TEXT | Phương thức thanh toán |

### vendors (Nhà Cung Cấp)
| Trường | Kiểu | Mô Tả |
|--------|------|-------|
| id | TEXT | ID duy nhất |
| company_id | TEXT | FK → companies |
| name | TEXT | Tên nhà cung cấp |
| tax_code | TEXT | Mã số thuế |
| email | TEXT | Email |
| phone | TEXT | Điện thoại |
| bank_account | TEXT | Số tài khoản |

### customers (Khách Hàng)
Tương tự như vendors

---

## 🎯 Ví Dụ Thực Tế

### Ví Dụ 1: Tạo Quy Trình Hóa Đơn Hoàn Chỉnh

```javascript
async function createCompleteInvoice() {
    const companyId = 'comp-123';
    
    try {
        // 1. Lấy mẫu hóa đơn
        const templates = await window.electronAPI.invoiceTemplates.getAll(companyId);
        const template = templates.data[0];
        
        // 2. Tạo hóa đơn
        const invoiceRes = await window.electronAPI.invoices.create({
            company_id: companyId,
            template_id: template.id,
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            items: [
                {
                    description: 'Dịch vụ tư vấn',
                    quantity: 10,
                    unit_price: 500000,
                    tax_rate: 10
                }
            ]
        });
        
        const invoiceId = invoiceRes.data.id;
        
        // 3. Ghi nhận thanh toán 50%
        await window.electronAPI.invoices.recordPayment(invoiceId, {
            amount: 2750000, // 50% của 5,500,000
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'bank_transfer'
        });
        
        // 4. Kiểm tra trạng thái
        const invoice = await window.electronAPI.invoices.getById(invoiceId);
        console.log('Trạng thái:', invoice.data.payment_status); // "partial"
        
    } catch (error) {
        console.error('Lỗi:', error);
    }
}

// Gọi hàm
createCompleteInvoice();
```

### Ví Dụ 2: Tạo Dashboard Cảnh Báo

```javascript
async function displayInvoiceAlerts() {
    const companyId = 'comp-123';
    
    // Hóa đơn quá hạn
    const overdue = await window.electronAPI.invoices.getOverdue(companyId);
    console.log(`⚠️  ${overdue.data.length} hóa đơn quá hạn`);
    
    // Hóa đơn sắp đến hạn
    const upcoming = await window.electronAPI.invoices.getUpcoming(companyId);
    console.log(`📅 ${upcoming.data.length} hóa đơn sắp đến hạn`);
    
    // Thống kê
    const stats = await window.electronAPI.invoices.getStats(companyId);
    const pendingTotal = stats.data
        .filter(s => s.payment_status === 'pending')
        .reduce((sum, s) => sum + s.total_amount, 0);
    console.log(`💰 Tổng chưa thanh toán: ${pendingTotal.toLocaleString('vi-VN')} VND`);
}

displayInvoiceAlerts();
```

---

## 🛠️ Troubleshooting

### Lỗi: `better-sqlite3 build failed`
**Giải pháp:**
```bash
npm run rebuild
```

### Lỗi: `Database locked`
**Giải pháp:** Đóng ứng dụng và mở lại. Nếu vẫn lỗi:
```bash
rm -f ~/.config/ung_dung_ke_toan_5/accounting.sqlite
```

### Lỗi: `Cannot find module 'electron'`
**Giải pháp:**
```bash
npm install
npm install -g electron
```

---

## 📖 Tài Liệu Thêm

- [Electron Documentation](https://www.electronjs.org/docs)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [better-sqlite3 Guide](https://github.com/WiseLibs/better-sqlite3)

---

## 📝 Ghi Chú Quan Trọng

✅ **Ưu Điểm:**
- Hoàn toàn offline, không cần internet
- Dữ liệu được mã hóa và lưu trữ cục bộ
- Sao lưu tự động hàng ngày
- Tính toán VAT tự động
- Giao diện thân thiện

⚠️ **Lưu Ý:**
- Soft delete: xóa chỉ đánh dấu, không xóa thật
- Tất cả tiền tệ tính bằng VND
- Ngày sử dụng định dạng YYYY-MM-DD
- IDs được tự động sinh unique

---

## 👨‍💻 Phát Triển

### Cấu Trúc Code
- **Main Process:** `src/main/main.js`
- **Renderer Process:** `src/renderer/index.html`
- **IPC Bridge:** `src/preload/preload.js`
- **Business Logic:** `src/services/`
- **Database:** `src/repositories/`

### Thêm Tính Năng Mới
1. Thêm repository
2. Thêm service
3. Thêm controller
4. Kích hoạt controller trong `main.js`

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra file log trong thư mục userData
2. Chạy `npm run rebuild`
3. Tạo issue trên GitHub

---

## 📄 License

ISC License - Xem file LICENSE để chi tiết

---

**Cập nhật lần cuối:** 2026-07-09
**Phiên bản:** 1.0.0
