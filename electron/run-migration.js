#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

const EnhancedDatabase = require('./enhanced-database');
const DatabaseMigrator = require('./database-migrator');

async function openOldDb(oldDbPath) {
    if (!fs.existsSync(oldDbPath)) throw new Error(`Old DB not found: ${oldDbPath}`);
    const db = new sqlite3.Database(oldDbPath);
    db.allAsync = promisify(db.all).bind(db);
    db.getAsync = promisify(db.get).bind(db);
    db.runAsync = promisify(db.run).bind(db);
    db.execAsync = promisify(db.exec).bind(db);
    return {
        all: async (sql) => {
            return await db.allAsync(sql);
        },
        path: oldDbPath,
        _db: db
    };
}

function parseArgs() {
    const args = process.argv.slice(2);
    const opts = {};
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '--old' || a === '-o') {
            opts.old = args[++i];
        } else if (a === '--new' || a === '-n') {
            opts.new = args[++i];
        } else if (a === '--backup-dir' || a === '-b') {
            opts.backupDir = args[++i];
        }
    }
    return opts;
}

(async () => {
    try {
        const opts = parseArgs();
        if (!opts.old) {
            console.error('Usage: node run-migration.js --old /path/to/old.db --new /path/to/new.db [--backup-dir /path]');
            process.exit(1);
        }
        const oldDbPath = path.resolve(opts.old);
        const newDbPath = opts.new ? path.resolve(opts.new) : path.join(path.dirname(oldDbPath), 'enhanced-pos.db');
        const backupDir = opts.backupDir ? path.resolve(opts.backupDir) : path.join(path.dirname(oldDbPath), 'backups');

        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `pre_migration_${timestamp}.db`);
        fs.copyFileSync(oldDbPath, backupPath);
        console.log(`Backup created at ${backupPath}`);

        const oldDb = await openOldDb(oldDbPath);
        const newDb = new EnhancedDatabase({ dbPath: newDbPath, baseDir: path.dirname(newDbPath) });
        await newDb.initialize();

        // attach runAsync if not present
        if (!newDb.db.runAsync) {
            newDb.db.runAsync = promisify(newDb.db.run).bind(newDb.db);
            newDb.db.allAsync = promisify(newDb.db.all).bind(newDb.db);
            newDb.db.getAsync = promisify(newDb.db.get).bind(newDb.db);
            newDb.db.execAsync = promisify(newDb.db.exec).bind(newDb.db);
        }

        const migrator = new DatabaseMigrator(oldDb, newDb);
        // log backup in new DB
        await newDb.logBackup(backupPath, 'SYSTEM', fs.statSync(backupPath).size);

        // Apply SQL migration files into the new DB (if any)
        const migrationsDir = path.join(__dirname, 'migrations');
        if (fs.existsSync(migrationsDir)) {
            // ensure migrations table exists
            await newDb.db.execAsync(`CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
            const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
            const applied = (await newDb.db.allAsync('SELECT name FROM migrations')).map(r => r.name);
            for (const file of files) {
                const name = path.basename(file, '.sql');
                if (!applied.includes(name)) {
                    console.log(`Applying migration file: ${file}`);
                    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                    // Execute migration SQL (may include its own transactions)
                    await newDb.db.execAsync(sql);
                    await newDb.db.runAsync('INSERT INTO migrations (name) VALUES (?)', [name]);
                    console.log(`Applied migration: ${name}`);
                }
            }
        }

        // Ensure legacy tables exist in the new DB that migrator expects
        await newDb.db.execAsync(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await newDb.db.execAsync(`
            CREATE TABLE IF NOT EXISTS expenses (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                amount REAL NOT NULL,
                date DATETIME NOT NULL,
                category TEXT NOT NULL,
                userId TEXT NOT NULL,
                supplierId TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await migrator.migrateData();

        console.log('Migration finished successfully');
        // close DBs
        try { oldDb._db.close(); } catch(e){}
        try { newDb.close(); } catch(e){}
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
})();
