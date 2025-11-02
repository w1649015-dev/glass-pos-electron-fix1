const EnhancedDatabase = require('../enhanced-database');
const path = require('path');
const fs = require('fs');
const os = require('os');

// محاكاة بيئة Electron
jest.mock('electron', () => ({
    app: {
        getPath: jest.fn(() => require('os').tmpdir())
    }
}));

describe('EnhancedDatabase', () => {
    let db;
    let testDbPath;

    beforeEach(async () => {
        // إنشاء مسار مؤقت لقاعدة البيانات
        testDbPath = path.join(os.tmpdir(), `test-pos-${Date.now()}.db`);
        
        db = new EnhancedDatabase({
            baseDir: os.tmpdir(),
            dbPath: testDbPath
        });
        await db.initialize();
    });

    afterEach(() => {
        if (db) {
            db.close();
        }
        // حذف ملف قاعدة البيانات الاختبارية
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    test('should initialize database with required tables', async () => {
        const tables = await db.db.allAsync(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `);

        const expectedTables = [
            'migrations',
            'audit_logs',
            'users',
            'user_sessions',
            'system_settings',
            'backup_logs'
        ];

        expect(tables.map(t => t.name).sort()).toEqual(expectedTables.sort());
    });

    test('should create a new user', async () => {
        const testUser = {
            id: 'test123',
            username: 'testuser',
            passwordHash: 'hashedpassword123',
            role: 'admin'
        };

        await db.createUser(testUser);

        const user = await db.db.getAsync(
            'SELECT * FROM users WHERE id = ?',
            [testUser.id]
        );

        expect(user).toBeTruthy();
        expect(user.username).toBe(testUser.username);
        expect(user.role).toBe(testUser.role);
    });

    test('should track failed login attempts', async () => {
        const userId = 'test123';
        // إنشاء مستخدم للاختبار
        await db.createUser({ id: userId, username: 'testuser', passwordHash: 'hash', role: 'admin' });

        // محاولة فاشلة
        await db.updateUserLoginAttempt(userId, false);
        let user = await db.db.getAsync(
            'SELECT failed_login_attempts FROM users WHERE id = ?',
            [userId]
        );
        expect(user.failed_login_attempts).toBe(1);

        // محاولة ناجحة
        await db.updateUserLoginAttempt(userId, true);
        user = await db.db.getAsync(
            'SELECT failed_login_attempts FROM users WHERE id = ?',
            [userId]
        );
        expect(user.failed_login_attempts).toBe(0);
    });

    test('should create and validate sessions', async () => {
        const userId = 'test123';
        const token = 'testtoken123';
        const expiresAt = new Date(Date.now() + 3600000).toISOString();

        await db.createSession(userId, token, expiresAt);
        
        const sessions = await db.db.allAsync(
            'SELECT * FROM user_sessions WHERE user_id = ? AND is_valid = true',
            [userId]
        );
        
        expect(sessions.length).toBe(1);
        expect(sessions[0].token).toBe(token);

        await db.invalidateSession(sessions[0].id);
        
        const validSessions = await db.db.allAsync(
            'SELECT * FROM user_sessions WHERE user_id = ? AND is_valid = true',
            [userId]
        );
        
        expect(validSessions.length).toBe(0);
    });

    test('should log audit events', async () => {
        const testAudit = {
            userId: 'test123',
            action: 'TEST_ACTION',
            details: { test: 'data' }
        };

        await db.logAudit(
            testAudit.userId,
            testAudit.action,
            testAudit.details
        );

        const logs = await db.db.allAsync(
            'SELECT * FROM audit_logs WHERE user_id = ?',
            [testAudit.userId]
        );

        expect(logs.length).toBe(1);
        expect(logs[0].action).toBe(testAudit.action);
        expect(JSON.parse(logs[0].details)).toEqual(testAudit.details);
    });
});