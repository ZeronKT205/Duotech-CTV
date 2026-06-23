import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Commission from '@/lib/models/Commission';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const users = await User.find({}).sort({ createdAt: -1 }).lean();

    // Aggregating pending commissions count per CTV
    const pendingCounts = {};
    const pendingCommissions = await Commission.find({ status: 'pending' }).lean();
    pendingCommissions.forEach(c => {
      if (c.ctvId) {
        const ctvIdStr = c.ctvId.toString();
        pendingCounts[ctvIdStr] = (pendingCounts[ctvIdStr] || 0) + 1;
      }
    });

    return Response.json({ users, pendingCounts });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
