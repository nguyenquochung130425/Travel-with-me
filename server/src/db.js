import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

export const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  user: process.env.DB_USER || 'travel_user',
  password: process.env.DB_PASSWORD || 'Travel@2026',
  database: process.env.DB_NAME || 'TravelWithMe',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise = null;

export async function getDbPool() {
  if (!poolPromise) {
    poolPromise = sql
      .connect(dbConfig)
      .then((pool) => {
        console.log(`[SQL Server] Đã kết nối thành công tới Database: ${dbConfig.database} trên ${dbConfig.server}!`);
        return pool;
      })
      .catch((err) => {
        console.error('[SQL Server] Lỗi kết nối CSDL:', err.message);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

export { sql };
