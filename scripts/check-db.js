import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value.trim();
      }
    });
  }
} catch (err) {
  console.warn('⚠️ Error parsing .env.local file:', err);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function check() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));

  const projects = await db.collection('projects').find({}).toArray();
  console.log(`\nProjects count: ${projects.length}`);
  projects.forEach(p => {
    console.log(`- Project Code: ${p.projectCode}, Status: ${p.status}, Commission Total: ${p.commissionTotal}`);
  });

  const commissions = await db.collection('commissions').find({}).toArray();
  console.log(`\nCommissions count: ${commissions.length}`);
  commissions.forEach(c => {
    console.log(`- Order: ${c.orderCode}, Project: ${c.projectCode || 'None'}, Phase: ${c.phase}, Amount: ${c.amount}, Status: ${c.status}`);
  });

  await mongoose.disconnect();
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
