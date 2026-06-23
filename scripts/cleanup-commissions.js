import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env manually
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

async function cleanup() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  const db = mongoose.connection.db;

  // Find all projects that are not completed
  const activeProjects = await db.collection('projects').find({
    status: { $ne: 'completed' }
  }).toArray();

  console.log(`📋 Found ${activeProjects.length} projects that are not completed`);

  let cleanedCount = 0;

  for (const project of activeProjects) {
    // Delete any pending phase 2 commission for this project
    const result = await db.collection('commissions').deleteMany({
      projectId: project._id,
      phase: 2,
      status: 'pending'
    });
    
    if (result.deletedCount > 0) {
      console.log(`  🗑️ Deleted ${result.deletedCount} pending Phase 2 commissions for project ${project.projectCode} (status: ${project.status})`);
      cleanedCount += result.deletedCount;
    }
  }

  console.log(`\n==================================================`);
  console.log(`✅ Cleanup complete! Removed ${cleanedCount} pending Phase 2 commissions.`);
  
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

cleanup().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
