const fs = require('fs');
const path = require('path');

class DatabaseMigration {
    constructor(db) {
        this.db = db;
        this.migrationsPath = path.join(__dirname, 'migrations');
    }

    async runMigrations() {
        // التأكد من وجود جدول الترقيات
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // قراءة جميع ملفات الترقية
        const files = fs.readdirSync(this.migrationsPath)
            .filter(file => file.endsWith('.sql'))
            .sort();

        // الحصول على الترقيات المطبقة
        const appliedMigrations = this.db.prepare(
            'SELECT name FROM migrations'
        ).all().map(m => m.name);

        // تطبيق الترقيات الجديدة
        for (const file of files) {
            const migrationName = path.basename(file, '.sql');
            if (!appliedMigrations.includes(migrationName)) {
                try {
                    console.log(`Applying migration: ${migrationName}`);
                    
                    // قراءة وتنفيذ ملف الترقية
                    const migration = fs.readFileSync(
                        path.join(this.migrationsPath, file),
                        'utf8'
                    );

                    // بدء المعاملة
                    this.db.exec('BEGIN TRANSACTION;');

                    // تنفيذ الترقية
                    this.db.exec(migration);

                    // تسجيل الترقية
                    this.db.prepare(
                        'INSERT INTO migrations (name) VALUES (?)'
                    ).run(migrationName);

                    // إنهاء المعاملة
                    this.db.exec('COMMIT;');

                    console.log(`Successfully applied migration: ${migrationName}`);
                } catch (error) {
                    // التراجع عن التغييرات في حالة الخطأ
                    this.db.exec('ROLLBACK;');
                    console.error(`Error applying migration ${migrationName}:`, error);
                    throw error;
                }
            }
        }
    }

    async createMigration(name) {
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
        const fileName = `${timestamp}_${name}.sql`;
        const filePath = path.join(this.migrationsPath, fileName);

        const template = `-- Migration: ${name}
-- Created at: ${new Date().toISOString()}

-- Up
BEGIN TRANSACTION;

-- Add your migration SQL here

COMMIT;

-- Down
BEGIN TRANSACTION;

-- Add your rollback SQL here

ROLLBACK;
`;

        fs.writeFileSync(filePath, template);
        console.log(`Created new migration file: ${fileName}`);
        return fileName;
    }
}

module.exports = DatabaseMigration;