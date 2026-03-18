
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const testDb = async () => {
    // Try to connect directly and list tables
    console.log('--- Connecting to PostgreSQL directly ---');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
    });

    try {
        const client = await pool.connect();
        console.log('SUCCESS: Connected to PostgreSQL');
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables in public schema:', res.rows.map(r => r.table_name));
        client.release();
    } catch (err: any) {
        console.error('FAILED to connect/query PostgreSQL:', err.message);
    } finally {
        await pool.end();
    }
}

testDb();
