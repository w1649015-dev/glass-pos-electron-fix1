const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

class EnhancedDatabase {
    constructor(options = {}) {
        const baseDir = options.baseDir || (process.type === 'renderer' ? require('electron').app.getPath('userData') : process.cwd());
        this.dbDir = path.join(baseDir, 'data');
        this.dbPath = options.dbPath || path.join(this.dbDir, 'enhanced-pos.db');
        this.migrationPath = path.join(__dirname, 'migrations');
        this.initialized = false;
        
        // إنشاء المجلدات إذا لم تكن موجودة
        if (!fs.existsSync(this.dbDir)) {
            fs.mkdirSync(this.dbDir, { recursive: true });
        }
        if (!fs.existsSync(this.migrationPath)) {
            fs.mkdirSync(this.migrationPath, { recursive: true });
        }
    }

    async initialize() {
        try {
            this.db = new sqlite3.Database(this.dbPath);

            // Promisify commonly used methods for async/await style
            this.db.runAsync = promisify(this.db.run).bind(this.db);
            this.db.getAsync = promisify(this.db.get).bind(this.db);
            this.db.allAsync = promisify(this.db.all).bind(this.db);
            this.db.execAsync = promisify(this.db.exec).bind(this.db);

            await this.initializeTables();
            await this.createInitialMigration();
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }

    async initializeTables() {
        // إنشاء جدول التحديثات
        await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // إنشاء جدول سجلات التدقيق
        await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                action TEXT NOT NULL,
                details TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                user_agent TEXT
            );
        `);

        // إنشاء جدول المستخدمين المحسن
        await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                status TEXT DEFAULT 'active',
                failed_login_attempts INTEGER DEFAULT 0,
                last_failed_login TIMESTAMP,
                reset_token TEXT,
                reset_token_expires TIMESTAMP
            );
        `);

        // إنشاء جدول جلسات المستخدمين
        await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_valid BOOLEAN DEFAULT true,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `);

        // إنشاء جدول إعدادات النظام
        await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS system_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_by TEXT,
                FOREIGN KEY (updated_by) REFERENCES users(id)
            );
        `);

        // إنشاء جدول النسخ الاحتياطي
        await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS backup_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by TEXT,
                size INTEGER,
                status TEXT DEFAULT 'pending',
                completed_at TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            );
        `);
    }

    async createInitialMigration() {
        const initialMigrationSQL = `
            -- Initial Migration
            INSERT INTO migrations (name) VALUES ('initial_schema_v1');
        `;

        const migrationFile = path.join(this.migrationPath, '001_initial_schema.sql');
        if (!fs.existsSync(migrationFile)) {
            fs.writeFileSync(migrationFile, initialMigrationSQL);
        }
    }

    // وظائف المساعدة للتدقيق
    async logAudit(userId, action, details) {
        const sql = 'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)';
        return await this.db.runAsync(sql, [userId, action, JSON.stringify(details)]);
    }

    // وظائف إدارة المستخدمين
    async createUser(userData) {
        const sql = `INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)`;
        return await this.db.runAsync(sql, [userData.id, userData.username, userData.passwordHash, userData.role]);
    }

    async updateUserLoginAttempt(userId, success) {
        if (success) {
            const sql = `UPDATE users SET last_login = CURRENT_TIMESTAMP, failed_login_attempts = 0 WHERE id = ?`;
            return await this.db.runAsync(sql, [userId]);
        } else {
            const sql = `UPDATE users SET failed_login_attempts = failed_login_attempts + 1, last_failed_login = CURRENT_TIMESTAMP WHERE id = ?`;
            return await this.db.runAsync(sql, [userId]);
        }
    }

    // وظائف إدارة الجلسات
    async createSession(userId, token, expiresAt) {
        const sql = `INSERT INTO user_sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`;
        return await this.db.runAsync(sql, [this.generateId(), userId, token, expiresAt]);
    }

    async invalidateSession(sessionId) {
        const sql = `UPDATE user_sessions SET is_valid = false WHERE id = ?`;
        return await this.db.runAsync(sql, [sessionId]);
    }

    // وظائف النسخ الاحتياطي
    async logBackup(filename, userId, size) {
        const sql = `INSERT INTO backup_logs (filename, created_by, size, status) VALUES (?, ?, ?, 'completed')`;
        return await this.db.runAsync(sql, [filename, userId, size]);
    }

    // وظيفة مساعدة لإنشاء معرفات فريدة
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // وظيفة إغلاق قاعدة البيانات
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = EnhancedDatabase;