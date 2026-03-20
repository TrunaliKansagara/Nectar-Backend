
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const testDb = async () => {
    console.log('--- Probing Database Schema ---');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });

    try {
        const client = await pool.connect();
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables:', tablesRes.rows.map(r => r.table_name));

        const bannerRes = await client.query('SELECT count(*) FROM banners');
        console.log('Banners count:', bannerRes.rows[0].count);

        const categoryRes = await client.query('SELECT count(*) FROM categories');
        console.log('Categories count:', categoryRes.rows[0].count);

        const productsRes = await client.query('SELECT count(*) FROM products');
        console.log('Products count:', productsRes.rows[0].count);

        const exclusiveRes = await client.query('SELECT count(*) FROM products WHERE is_exclusive = true');
        console.log('Exclusive products count:', exclusiveRes.rows[0].count);

        const bestSellingRes = await client.query('SELECT count(*) FROM products WHERE is_best_selling = true');
        console.log('Best selling products count:', bestSellingRes.rows[0].count);

        client.release();
    } catch (err: any) {
        console.error('Probing failed:', err.message);
    } finally {
        await pool.end();
    }
}

testDb();
