import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Commission from '@/lib/models/Commission';
import Order from '@/lib/models/Order';
import { cache } from '@/lib/cache';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const cacheKey = 'users:list';
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return Response.json(cachedData);
    }

    const [users, commissionStats, orderStats] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }).lean(),
      Commission.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: '$ctvId', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
      ]),
      Order.aggregate([
        {
          $group: {
            _id: '$ctvId',
            totalCount: { $sum: 1 },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            }
          }
        }
      ]),
    ]);

    const pendingCounts = {};
    const pendingAmounts = {};
    commissionStats.forEach(item => {
      if (item._id) {
        const ctvIdStr = item._id.toString();
        pendingCounts[ctvIdStr] = item.count;
        pendingAmounts[ctvIdStr] = item.amount;
      }
    });

    const pendingOrderCounts = {};
    const totalOrderCounts = {};
    orderStats.forEach(item => {
      if (item._id) {
        const ctvIdStr = item._id.toString();
        totalOrderCounts[ctvIdStr] = item.totalCount;
        pendingOrderCounts[ctvIdStr] = item.pendingCount;
      }
    });

    const responseData = {
      users,
      pendingCounts,
      pendingAmounts,
      pendingOrderCounts,
      totalOrderCounts,
    };

    cache.set(cacheKey, responseData, 30); // Cache for 30 seconds

    return Response.json(responseData);
  } catch (error) {
    console.error('GET /api/users error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

