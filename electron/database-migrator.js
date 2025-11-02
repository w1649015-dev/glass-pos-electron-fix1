const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// When running the migration as a standalone Node script `electron` may not be available.
// Provide a safe fallback for `app.getPath('userData')` so the migrator can run outside Electron.
let app;
try {
    app = require('electron').app;
} catch (err) {
    app = {
        getPath: (name) => {
            // Allow overriding via env var MIGRATION_USER_DATA, otherwise use cwd
            return process.env.MIGRATION_USER_DATA || process.cwd();
        }
    };
}

class DatabaseMigrator {
    constructor(oldDb, newDb) {
        this.oldDb = oldDb;
        this.newDb = newDb;
    }

    async migrateData() {
        console.log('Starting data migration...');
        
        try {
            // بدء المعاملة
            await this.newDb.db.execAsync('BEGIN TRANSACTION');

            // نقل المستخدمين
            await this.migrateUsers();
            
            // نقل المنتجات
            await this.migrateProducts();
            
            // نقل العملاء
            await this.migrateCustomers();
            
            // نقل الموردين
            await this.migrateSuppliers();
            
            // نقل المبيعات
            await this.migrateSales();
            
            // نقل المصروفات
            await this.migrateExpenses();

            // تأكيد المعاملة
            await this.newDb.db.execAsync('COMMIT');
            
            console.log('Data migration completed successfully');
            return true;
        } catch (error) {
            // التراجع عن التغييرات في حالة حدوث خطأ
            await this.newDb.db.execAsync('ROLLBACK');
            console.error('Error during migration:', error);
            throw error;
        }
    }

    async migrateUsers() {
        console.log('Migrating users...');
        const users = await this.oldDb.all('SELECT * FROM users');
        
        for (const user of users) {
            const passwordHash = user.password_hash || user.passwordHash || bcrypt.hashSync('123456', 10);
            await this.newDb.createUser({
                id: user.id,
                username: user.username,
                passwordHash,
                role: user.role || 'cashier'
            });
            
            // تسجيل في سجل التدقيق
            await this.newDb.logAudit(
                'SYSTEM',
                'USER_MIGRATED',
                { userId: user.id, username: user.username }
            );
        }
    }

    async migrateProducts() {
        console.log('Migrating products...');
        const products = await this.oldDb.all('SELECT * FROM products');
        const sql = `INSERT INTO products_new (id, name, barcode, price_minor, cost_minor, stock, category_id, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        for (const product of products) {
            await this.newDb.db.runAsync(sql, [
                product.id,
                product.name,
                product.barcode || null,
                Math.round((product.price || product.price_minor || 0) * 100),
                product.cost_minor || 0,
                product.stock || 0,
                product.category_id || null,
                product.description || '',
                'active'
            ]);
            
            await this.newDb.logAudit(
                'SYSTEM',
                'PRODUCT_MIGRATED',
                { productId: product.id, name: product.name }
            );
        }
    }

    async migrateCustomers() {
        console.log('Migrating customers...');
        const customers = await this.oldDb.all('SELECT * FROM customers');
        const sql = `INSERT INTO customers_new (id, name, phone, email, address, total_purchases_minor, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;

        for (const customer of customers) {
            await this.newDb.db.runAsync(sql, [
                customer.id,
                customer.name,
                customer.phone || null,
                customer.email || null,
                customer.address || null,
                customer.total_purchases_minor || 0,
                'active'
            ]);
            
            await this.newDb.logAudit(
                'SYSTEM',
                'CUSTOMER_MIGRATED',
                { customerId: customer.id, name: customer.name }
            );
        }
    }

    async migrateSales() {
        console.log('Migrating sales...');
        const sales = await this.oldDb.all('SELECT * FROM sales');
        const sql = `INSERT INTO sales_new (id, customer_id, user_id, total_minor, payment_method, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`;

        for (const sale of sales) {
            await this.newDb.db.runAsync(sql, [
                sale.id,
                sale.customer_id || null,
                sale.user_id || null,
                Math.round((sale.total || sale.total_minor || 0) * 100),
                sale.payment_method || 'cash',
                sale.payment_status || 'completed',
                sale.created_at || new Date().toISOString()
            ]);
            
            await this.newDb.logAudit(
                'SYSTEM',
                'SALE_MIGRATED',
                { saleId: sale.id, totalMinor: sale.total_minor }
            );
        }
    }

    async migrateSuppliers() {
        console.log('Migrating suppliers...');
        const suppliers = await this.oldDb.all('SELECT * FROM suppliers');
        const sql = `INSERT INTO suppliers (id, name, phone, email, created_at) VALUES (?, ?, ?, ?, ?)`;

        for (const s of suppliers) {
            await this.newDb.db.runAsync(sql, [
                s.id,
                s.name,
                s.phone || null,
                s.email || null,
                s.createdAt || new Date().toISOString()
            ]);

            await this.newDb.logAudit('SYSTEM', 'SUPPLIER_MIGRATED', { supplierId: s.id, name: s.name });
        }
    }

    async migrateExpenses() {
        console.log('Migrating expenses...');
        const expenses = await this.oldDb.all('SELECT * FROM expenses');
        const sql = `INSERT INTO expenses (id, title, amount, date, category, userId, supplierId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        for (const e of expenses) {
            await this.newDb.db.runAsync(sql, [
                e.id,
                e.title,
                e.amount,
                e.date || new Date().toISOString(),
                e.category || null,
                e.userId || null,
                e.supplierId || null,
                e.createdAt || new Date().toISOString()
            ]);

            await this.newDb.logAudit('SYSTEM', 'EXPENSE_MIGRATED', { expenseId: e.id, title: e.title });
        }
    }

    // وظيفة لإنشاء نسخة احتياطية قبل الترقية
    async createBackup() {
        const backupDir = path.join(app.getPath('userData'), 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `pre_migration_backup_${timestamp}.db`);
        
        fs.copyFileSync(this.oldDb.path, backupPath);
        
        await this.newDb.logBackup(
            backupPath,
            'SYSTEM',
            fs.statSync(backupPath).size
        );

        return backupPath;
    }
}

module.exports = DatabaseMigrator;