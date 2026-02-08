/*
* Name: DB.js
* Description: Database connection setup using PostgreSQL.
* Author: Tumelo George
* Date: November 22, 2025
*/
const { Pool } = require('pg');
require('dotenv').config({path: '.env'});

// verify env variables
if (!process.env.PG_USER || !process.env.PG_PASSWORD || !process.env.PG_HOST || !process.env.PG_DATABASE) {
  console.error('❌ Missing required database environment variables. Please check your .env file.');
  process.exit(1);
}

class Database {
  constructor() {
    this.pool = new Pool({
      user: process.env.PG_USER || 'postgres',
      host: process.env.PG_HOST || 'localhost',
      database: process.env.PG_DATABASE || "Selokong_Farms_DB",
      password: process.env.PG_PASSWORD,
      port: process.env.PG_PORT || 5432,
      ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
  }  

  async query(text, params) {
  const start = Date.now();
  try {
    const res = await this.pool.query(text, params);
    const duration = Date.now() - start;

    console.log('Executed query', { 
      text, 
      duration, 
      rows: res?.rowCount 
    });

    return res;
  } catch (err) {
    console.error('❌ Query error:', { text, message: err.message });
    throw err;
  }
}
  
}

module.exports = new Database();
