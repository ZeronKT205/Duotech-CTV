/**
 * Migration Script: Orders → Projects
 * 
 * Run this script to migrate existing orders with advanced statuses
 * (consulting, contracted, in_progress, completed, cancelled)
 * into the new Project model.
 * 
 * Usage:
 *   node scripts/migrate-orders-to-projects.js
 *   node scripts/migrate-orders-to-projects.js --dry-run
 * 
 * Requires: MONGODB_URI environment variable
 */

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

const isDryRun = process.argv.includes('--dry-run');
if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');
}

async function migrate() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  const db = mongoose.connection.db;

  // Get orders with statuses that need migration
  const ordersToMigrate = await db.collection('orders').find({
    status: { $in: ['consulting', 'contracted', 'in_progress', 'completed', 'cancelled'] }
  }).toArray();

  console.log(`📋 Found ${ordersToMigrate.length} orders to migrate\n`);

  if (ordersToMigrate.length === 0) {
    console.log('✅ Nothing to migrate!');
    await mongoose.disconnect();
    return;
  }

  const statusProgress = {
    consulting: 20,
    contracted: 40,
    in_progress: 70,
    completed: 100,
    cancelled: 0,
  };

  let successCount = 0;
  let errorCount = 0;

  for (const order of ordersToMigrate) {
    try {
      console.log(`  📦 Migrating ${order.orderCode} (${order.status})...`);

      // Generate project code
      const projectCount = await db.collection('projects').countDocuments();
      const projectCode = `DA-${String(projectCount + successCount + 1).padStart(4, '0')}`;

      const projectStatus = order.status === 'cancelled' ? 'cancelled' : order.status;

      const projectData = {
        projectCode,
        orderId: order._id,
        orderCode: order.orderCode,
        ctvId: order.ctvId,
        customerName: '',
        websiteType: order.websiteType,
        description: order.description || '',
        status: projectStatus,
        progress: statusProgress[projectStatus] || 0,
        contractValue: order.contractValue || 0,
        commissionRate: order.commissionRate || 7,
        commissionTotal: order.commissionTotal || 0,
        zaloGroupLink: order.zaloGroupName || '',
        contactLinks: [],
        notes: [{
          content: `Dự án được tạo tự động qua migration từ đơn hàng ${order.orderCode}`,
          createdAt: new Date(),
          statusChange: { from: null, to: projectStatus },
        }],
        cancelledAt: order.status === 'cancelled' ? order.updatedAt : null,
        cancelReason: order.status === 'cancelled' ? 'Migration từ đơn hàng cũ' : '',
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };

      if (!isDryRun) {
        // Create project
        const result = await db.collection('projects').insertOne(projectData);
        const projectId = result.insertedId;

        // Update order status to approved and link project
        await db.collection('orders').updateOne(
          { _id: order._id },
          {
            $set: {
              status: 'approved',
              projectId: projectId,
            },
            $unset: {
              contractValue: '',
              commissionRate: '',
              commissionTotal: '',
              zaloGroupName: '',
            }
          }
        );

        // Update related commissions to link with project
        await db.collection('commissions').updateMany(
          { orderId: order._id },
          {
            $set: {
              projectId: projectId,
              projectCode: projectCode,
            }
          }
        );

        console.log(`     ✅ Created project ${projectCode}, updated order & commissions`);
      } else {
        console.log(`     📝 Would create project ${projectCode}`);
      }

      successCount++;
    } catch (err) {
      console.error(`     ❌ Error: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Migration ${isDryRun ? '(dry run) ' : ''}complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

migrate().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
