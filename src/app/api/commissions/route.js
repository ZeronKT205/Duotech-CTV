import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Commission from '@/lib/models/Commission';
import User from '@/lib/models/User';
import Project from '@/lib/models/Project';
import { cache } from '@/lib/cache';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    // Create unique cache key based on query parameters and user context
    const cacheKey = `commissions:list:all=${all}:user=${session.user.role === 'admin' && all ? 'admin' : session.user.email}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return Response.json(cachedData);
    }

    let query = {};
    if (!all || session.user.role !== 'admin') {
      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        return Response.json({ commissions: [] });
      }
      query.ctvId = user._id;
    }

    const commissions = await Commission.find(query)
      .populate('ctvId', 'name email phone bankName bankAccountNumber bankAccountName qrCodeImage')
      .populate('projectId', 'projectCode status progress customerName')
      .populate('paidBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const responseData = { commissions };
    cache.set(cacheKey, responseData, 15); // Cache for 15 seconds

    return Response.json(responseData);
  } catch (error) {
    console.error('GET /api/commissions error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

