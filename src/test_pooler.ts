
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const project = 'daauersdhhzmzseprqhs';
const password = 'DWr3hJRpGuW931do';

async function test() {
    console.log('--- Testing Transaction Pooler (IPv4 compatible) ---');
    const pool = new Pool({
        host: 'aws-0-ap-south-1.pooler.supabase.com',
        port: 6543,
        user: `postgres.${project}`,
        password: password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        const client = await pool.connect();
        const res = await client.query('SELECT username FROM users LIMIT 1');
        console.log('SUCCESS! Found user:', res.rows[0]);
        client.release();
    } catch (err: any) {
        console.error('FAILED:', err.message);
    } finally {
        await pool.end();
    }
}

test();
