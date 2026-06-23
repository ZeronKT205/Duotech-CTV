import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
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
    const limit = parseInt(searchParams.get('limit')) || 100;
    const all = searchParams.get('all') === 'true';

    // Create unique cache key based on query parameters and user context
    const cacheKey = `orders:list:all=${all}:limit=${limit}:user=${session.user.role === 'admin' && all ? 'admin' : session.user.email}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return Response.json(cachedData);
    }

    let query = {};
    if (!all || session.user.role !== 'admin') {
      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        return Response.json({ orders: [] });
      }
      query.ctvId = user._id;
    }

    const orders = await Order.find(query)
      .populate('projectId', 'status progress projectCode') // Populating only status, progress, projectCode instead of the full document
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const responseData = { orders };
    cache.set(cacheKey, responseData, 15); // Cache for 15 seconds

    return Response.json(responseData);
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.isActive) {
      return Response.json({ error: 'Tài khoản không hoạt động' }, { status: 403 });
    }

    const body = await request.json();
    const { websiteType, description, ctvPhone, note } = body;

    if (!websiteType || !description || !ctvPhone) {
      return Response.json({ error: 'Vui lòng điền đầy đủ thông tin' }, { status: 400 });
    }

    const commissionRate = parseInt(process.env.DEFAULT_COMMISSION_RATE) || 7;

    const order = await Order.create({
      ctvId: user._id,
      ctvEmail: user.email,
      ctvPhone,
      websiteType,
      description,
      note: note || '',
      commissionRate,
    });

    // Invalidate related cache keys
    cache.invalidate('orders:*');
    cache.invalidate('stats:*');
    cache.invalidate('users:*');

    return Response.json({ order, message: 'Tạo đơn thành công' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

