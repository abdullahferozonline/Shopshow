import dotenv from 'dotenv';
import { pool } from './utils/db';
import { hashPassword } from './utils/hash';

dotenv.config();

async function run() {
  console.log('Running seed...');

  // create admin if not exists
  const adminEmail = 'admin@shopshow.local';
  const adminPass = 'Password123!';

  const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
  if (existing.length === 0) {
    const hashed = hashPassword(adminPass);
    await pool.query(
      `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)`,
      [adminEmail, hashed, 'Administrator', 'admin']
    );
    console.log(`Created admin user: ${adminEmail} / ${adminPass}`);
  } else {
    console.log('Admin user already exists, skipping creation.');
  }

  // sample categories
  await pool.query(`
    INSERT INTO categories (id, name)
    SELECT gen_random_uuid(), 'General'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'General')
  `);

  // sample products (a few)
  const sampleProducts = [
    { sku: 'SKU-001', name: 'Sample Widget A', description: 'A sample widget', barcode: '1000000001' },
    { sku: 'SKU-002', name: 'Sample Widget B', description: 'Another widget', barcode: '1000000002' },
    { sku: 'SKU-003', name: 'Sample Widget C', description: 'Yet another widget', barcode: '1000000003' }
  ];

  for (const p of sampleProducts) {
    const { rows } = await pool.query('SELECT id FROM products WHERE sku = $1', [p.sku]);
    if (rows.length === 0) {
      await pool.query(
        `INSERT INTO products (sku, name, description, barcode, unit, track_by) VALUES ($1,$2,$3,$4,$5,$6)`,
        [p.sku, p.name, p.description, p.barcode, 'pcs', 'quantity']
      );
      console.log(`Inserted product ${p.sku}`);
    } else {
      console.log(`Product ${p.sku} exists, skipping`);
    }
  }

  console.log('Seed complete.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
