const crypto = require('crypto');
const bcrypt = require('bcrypt');

class SecurityManager {
    constructor(db) {
        this.db = db;
        this.saltRounds = 12;
        this.tokenExpiration = 24 * 60 * 60 * 1000; // 24 ساعة
    }

    // تشفير كلمة المرور
    async hashPassword(password) {
        return await bcrypt.hash(password, this.saltRounds);
    }

    // التحقق من كلمة المرور
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    // إنشاء رمز جلسة آمن
    generateSessionToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // التحقق من صلاحية الجلسة
    async validateSession(sessionToken) {
        const session = await this.db.db.getAsync(
            `SELECT * FROM user_sessions 
             WHERE token = ? AND is_valid = true 
             AND expires_at > datetime('now')`,
            [sessionToken]
        );
        return session ? session : null;
    }

    // قفل الحساب بعد محاولات فاشلة متعددة
    async checkLoginAttempts(userId) {
        const user = await this.db.db.getAsync(
            `SELECT failed_login_attempts, last_failed_login 
             FROM users WHERE id = ?`,
            [userId]
        );

        if (!user) return false;

        // إعادة تعيين المحاولات الفاشلة بعد ساعة
        if (user.last_failed_login) {
            const lastAttempt = new Date(user.last_failed_login);
            const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
            
            if (lastAttempt < hourAgo) {
                await this.db.db.runAsync(
                    'UPDATE users SET failed_login_attempts = 0 WHERE id = ?',
                    [userId]
                );
                return true;
            }
        }

        // قفل الحساب بعد 5 محاولات فاشلة
        return user.failed_login_attempts < 5;
    }

    // إنشاء رمز إعادة تعيين كلمة المرور
    async createPasswordResetToken(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // ساعة واحدة

        await this.db.db.runAsync(
            `UPDATE users 
             SET reset_token = ?, reset_token_expires = ? 
             WHERE id = ?`,
            [token, expires.toISOString(), userId]
        );

        return token;
    }

    // التحقق من رمز إعادة تعيين كلمة المرور
    async validateResetToken(token) {
        const user = await this.db.db.getAsync(
            `SELECT id FROM users 
             WHERE reset_token = ? 
             AND reset_token_expires > datetime('now')`,
            [token]
        );
        return user ? user.id : null;
    }

    // تسجيل محاولة وصول مشبوهة
    async logSuspiciousActivity(userId, activity, details) {
        await this.db.logAudit(
            userId,
            'SUSPICIOUS_ACTIVITY',
            {
                activity,
                details,
                ip: details.ip,
                userAgent: details.userAgent
            }
        );

        // إرسال إشعار للمسؤولين
        await this.notifyAdmins(userId, activity);
    }

    // إشعار المسؤولين
    async notifyAdmins(userId, activity) {
        const admins = await this.db.db.allAsync(
            "SELECT id FROM users WHERE role = 'admin'"
        );

        for (const admin of admins) {
            await this.db.db.runAsync(
                `INSERT INTO system_settings (key, value, updated_by)
                 VALUES (?, ?, ?)`,
                [
                    `security_alert_${Date.now()}`,
                    JSON.stringify({
                        userId,
                        activity,
                        timestamp: new Date().toISOString()
                    }),
                    admin.id
                ]
            );
        }
    }
}

module.exports = SecurityManager;