process.type = 'test';

// تنظيف الملفات المؤقتة عند انتهاء العملية (متوافق مع بيئة Jest)
const os = require('os');
const fs = require('fs');
const path = require('path');

const cleanupTestFiles = () => {
    const tmpDir = os.tmpdir();
    const testFiles = fs.readdirSync(tmpDir).filter(f => f.startsWith('test-pos-'));
    testFiles.forEach(file => {
        try {
            fs.unlinkSync(path.join(tmpDir, file));
        } catch (err) {
            // لا تفشل الاختبارات بسبب خطأ تنظيف
            console.error(`Error cleaning up test file ${file}:`, err);
        }
    });
};

// تنظيف عند الخروج من العملية
process.on('exit', cleanupTestFiles);