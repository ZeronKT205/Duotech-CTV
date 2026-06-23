import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Commission from '@/lib/models/Commission';
import Order from '@/lib/models/Order';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const users = await User.find({}).sort({ createdAt: -1 }).lean();

    // Aggregate pending commissions count and amount per CTV
    const pendingCounts = {};
    const pendingAmounts = {};
    const pendingCommissions = await Commission.find({ status: 'pending' }).lean();
    pendingCommissions.forEach(c => {
      if (c.ctvId) {
        const ctvIdStr = c.ctvId.toString();
        pendingCounts[ctvIdStr] = (pendingCounts[ctvIdStr] || 0) + 1;
        pendingAmounts[ctvIdStr] = (pendingAmounts[ctvIdStr] || 0) + c.amount;
      }
    });

    // Aggregate pending order counts per CTV
    const pendingOrderCounts = {};
    const totalOrderCounts = {};
    const orders = await Order.find({}).lean();
    orders.forEach(o => {
      if (o.ctvId) {
        const ctvIdStr = o.ctvId.toString();
        totalOrderCounts[ctvIdStr] = (totalOrderCounts[ctvIdStr] || 0) + 1;
        if (o.status === 'pending') {
          pendingOrderCounts[ctvIdStr] = (pendingOrderCounts[ctvIdStr] || 0) + 1;
        }
      }
    });

    return Response.json({
      users,
      pendingCounts,
      pendingAmounts,
      pendingOrderCounts,
      totalOrderCounts,
    });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
