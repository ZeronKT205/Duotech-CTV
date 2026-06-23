import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Project from '@/lib/models/Project';
import Commission from '@/lib/models/Commission';
import User from '@/lib/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const isAdmin = session.user.role === 'admin';

    let orderQuery = {};
    let projectQuery = {};
    let commissionQuery = {};

    if (!isAdmin) {
      const user = await User.findOne({ email: session.user.email });
      orderQuery.ctvId = user._id;
      projectQuery.ctvId = user._id;
      commissionQuery.ctvId = user._id;
    }

    const [totalOrders, pendingOrders, totalProjects, paidCommissions, pendingCommissions] = await Promise.all([
      Order.countDocuments(orderQuery),
      Order.countDocuments({ ...orderQuery, status: 'pending' }),
      Project.countDocuments(projectQuery),
      Commission.aggregate([
        { $match: { ...commissionQuery, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Commission.aggregate([
        { $match: { ...commissionQuery, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const stats = {
      totalOrders,
      pendingOrders,
      totalProjects,
      paidCommission: paidCommissions[0]?.total || 0,
      pendingCommission: pendingCommissions[0]?.total || 0,
    };

    if (isAdmin) {
      const totalCTV = await User.countDocuments({ role: 'ctv' });
      const totalContractValue = await Project.aggregate([
        { $match: { status: { $in: ['contracted', 'in_progress', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$contractValue' } } },
      ]);
      stats.totalCTV = totalCTV;
      stats.totalContractValue = totalContractValue[0]?.total || 0;
    }

    return Response.json(stats);
  } catch (error) {
    console.error('GET /api/stats error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
