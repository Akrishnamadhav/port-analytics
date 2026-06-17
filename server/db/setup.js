const fs = require('fs');
const path = require('path');
const pool = require('./index');
const { generateSeeds } = require('./generateSeeds');

async function setup() {
  const client = await pool.connect();
  try {
    // Run schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Running schema...');
    await client.query(schemaSql);
    console.log('Schema applied successfully.');

    // Generate seeds
    console.log('Generating seed data...');
    await generateSeeds();

    // Run seeds
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    console.log('Running seeds...');
    await client.query(seedSql);
    console.log('Seed data inserted successfully.');

    console.log('Database setup complete!');
  } catch (err) {
    console.error('Database setup failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
