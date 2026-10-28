import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DB_CLIENT = process.env.DB_CLIENT || 'auto'; // 'mysql', 'sqlite', or 'auto'
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'securefdr_db';

let dbDriver = null;
let isMySQL = false;
let sqliteDb = null;
let mysqlPool = null;

// Initialize Database connection
async function initDb() {
  if (dbDriver) return dbDriver;

  if (DB_CLIENT === 'mysql' || DB_CLIENT === 'auto') {
    try {
      const mysql = await import('mysql2/promise');
      const testPool = mysql.createPool({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        decimalNumbers: true,
        connectTimeout: 2000
      });

      // Quick test
      const conn = await testPool.getConnection();
      await conn.ping();
      conn.release();

      mysqlPool = testPool;
      isMySQL = true;
      console.log(`[Database] Connected successfully to MySQL (${DB_HOST}:${DB_PORT}/${DB_NAME})`);
      
      dbDriver = {
        isMySQL: true,
        type: 'mysql',
        async query(sql, params = []) {
          const [rows] = await mysqlPool.query(sql, params);
          return rows;
        },
        async execute(sql, params = []) {
          const [result] = await mysqlPool.execute(sql, params);
          return result;
        },
        async transaction(fn) {
          const connection = await mysqlPool.getConnection();
          await connection.beginTransaction();
          try {
            const result = await fn(connection);
            await connection.commit();
            return result;
          } catch (err) {
            await connection.rollback();
            throw err;
          } finally {
            connection.release();
          }
        }
      };
      return dbDriver;
    } catch (mysqlErr) {
      if (DB_CLIENT === 'mysql') {
        console.error('[Database] Failed to connect to required MySQL server:', mysqlErr.message);
        throw mysqlErr;
      }
      console.log(`[Database] MySQL not reachable on ${DB_HOST}:${DB_PORT} (${mysqlErr.message}).`);
      console.log('[Database] Activating robust zero-config local storage engine (node:sqlite) for prototype demo...');
    }
  }

  // Fallback to built-in node:sqlite
  try {
    const { DatabaseSync } = await import('node:sqlite');
    const dbDir = path.resolve(__dirname, '../../../database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbFile = path.resolve(dbDir, 'securefdr.sqlite');
    sqliteDb = new DatabaseSync(dbFile);
    
    // Enable foreign keys and WAL mode for performance & safety
    sqliteDb.exec('PRAGMA foreign_keys = ON;');

    console.log(`[Database] SQLite connected successfully at: ${dbFile}`);
    isMySQL = false;

    dbDriver = {
      isMySQL: false,
      type: 'sqlite',
      async query(sql, params = []) {
        // Normalize any MySQL specific syntax if necessary
        const normalizedSql = normalizeSqlForSqlite(sql);
        const stmt = sqliteDb.prepare(normalizedSql);
        const rows = stmt.all(...params);
        return rows;
      },
      async execute(sql, params = []) {
        const normalizedSql = normalizeSqlForSqlite(sql);
        const stmt = sqliteDb.prepare(normalizedSql);
        const result = stmt.run(...params);
        return {
          insertId: Number(result.lastInsertRowid),
          affectedRows: result.changes
        };
      },
      async transaction(fn) {
        sqliteDb.exec('BEGIN TRANSACTION;');
        try {
          const result = await fn({
            query: async (sql, params = []) => {
              const stmt = sqliteDb.prepare(normalizeSqlForSqlite(sql));
              return stmt.all(...params);
            },
            execute: async (sql, params = []) => {
              const stmt = sqliteDb.prepare(normalizeSqlForSqlite(sql));
              const r = stmt.run(...params);
              return { insertId: Number(r.lastInsertRowid), affectedRows: r.changes };
            }
          });
          sqliteDb.exec('COMMIT;');
          return result;
        } catch (err) {
          sqliteDb.exec('ROLLBACK;');
          throw err;
        }
      }
    };
    return dbDriver;
  } catch (err) {
    console.error('[Database] Failed to initialize SQLite storage:', err);
    throw err;
  }
}

function normalizeSqlForSqlite(sql) {
  let s = sql;
  // Replace NOW() with CURRENT_TIMESTAMP
  s = s.replace(/\bNOW\(\)/gi, "datetime('now')");
  // Replace CURDATE() with date('now')
  s = s.replace(/\bCURDATE\(\)/gi, "date('now')");
  // Replace DATE_SUB(CURDATE(), INTERVAL x DAY) or DATE_ADD
  s = s.replace(/DATE_ADD\(([^,]+),\s*INTERVAL\s+(\d+)\s+DAY\)/gi, "date($1, '+$2 days')");
  s = s.replace(/DATE_SUB\(([^,]+),\s*INTERVAL\s+(\d+)\s+DAY\)/gi, "date($1, '-$2 days')");
  return s;
}

export { initDb, isMySQL };
export default {
  initDb,
  query: async (sql, params) => {
    const driver = await initDb();
    return driver.query(sql, params);
  },
  execute: async (sql, params) => {
    const driver = await initDb();
    return driver.execute(sql, params);
  },
  transaction: async (fn) => {
    const driver = await initDb();
    return driver.transaction(fn);
  }
};
