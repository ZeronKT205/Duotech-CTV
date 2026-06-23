import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Project from '@/lib/models/Project';
import Commission from '@/lib/models/Commission';
import User from '@/lib/models/User';
import { cache } from '@/lib/cache';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const isAdmin = session.user.role === 'admin';

    // Check cache first
    const cacheKey = `stats:user=${isAdmin ? 'admin' : session.user.email}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return Response.json(cachedData);
    }

    let orderQuery = {};
    let projectQuery = {};
    let commissionQuery = {};

    if (!isAdmin) {
      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        return Response.json({
          totalOrders: 0,
          pendingOrders: 0,
          totalProjects: 0,
          paidCommission: 0,
          pendingCommission: 0,
        });
      }
      orderQuery.ctvId = user._id;
      projectQuery.ctvId = user._id;
      commissionQuery.ctvId = user._id;
    }

    const promises = [
      // 1. Order aggregation (total and pending counts in one go)
      Order.aggregate([
        { $match: orderQuery },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            }
          }
        }
      ]),
      // 2. Project counts
      Project.countDocuments(projectQuery),
      // 3. Commission aggregation (paid and pending amounts in one go)
      Commission.aggregate([
        { $match: { ...commissionQuery, status: { $in: ['paid', 'pending'] } } },
        { $group: { _id: '$status', total: { $sum: '$amount' } } }
      ])
    ];

    if (isAdmin) {
      // 4. Total CTV count
      promises.push(User.countDocuments({ role: 'ctv' }));
      // 5. Total contract value
      promises.push(Project.aggregate([
        { $match: { status: { $in: ['contracted', 'in_progress', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$contractValue' } } }
      ]));
    }

    const results = await Promise.all(promises);

    const orderStats = results[0][0] || { total: 0, pending: 0 };
    const totalOrders = orderStats.total;
    const pendingOrders = orderStats.pending;
    const totalProjects = results[1] || 0;

    const commissionStats = results[2] || [];
    let paidCommission = 0;
    let pendingCommission = 0;
    commissionStats.forEach(stat => {
      if (stat._id === 'paid') paidCommission = stat.total;
      if (stat._id === 'pending') pendingCommission = stat.total;
    });

    const stats = {
      totalOrders,
      pendingOrders,
      totalProjects,
      paidCommission,
      pendingCommission,
    };

    if (isAdmin) {
      stats.totalCTV = results[3] || 0;
      stats.totalContractValue = results[4][0]?.total || 0;
    }

    // Cache the statistics for 30 seconds
    cache.set(cacheKey, stats, 30);

    return Response.json(stats);
  } catch (error) {
    console.error('GET /api/stats error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

