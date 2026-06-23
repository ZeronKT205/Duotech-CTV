import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
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
    const status = searchParams.get('status');

    // Create unique cache key based on query params and user context
    const cacheKey = `projects:list:all=${all}:status=${status || 'all'}:user=${session.user.role === 'admin' && all ? 'admin' : session.user.email}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return Response.json(cachedData);
    }

    let query = {};
    if (!all || session.user.role !== 'admin') {
      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        return Response.json({ projects: [] });
      }
      query.ctvId = user._id;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const projects = await Project.find(query)
      .populate('ctvId', 'name email phone avatar') // Populating only general info, not bank details/QR code
      .populate('orderId', 'orderCode websiteType description')
      .sort({ createdAt: -1 })
      .lean();

    const responseData = { projects };
    cache.set(cacheKey, responseData, 15); // Cache for 15 seconds

    return Response.json(responseData);
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { orderId, customerName, zaloGroupLink, contractValue, contactLinks, description } = body;

    if (!orderId) {
      return Response.json({ error: 'Thiếu orderId' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return Response.json({ error: 'Đơn hàng không tìm thấy' }, { status: 404 });
    }

    if (order.status !== 'pending') {
      return Response.json({ error: 'Đơn hàng đã được xử lý' }, { status: 400 });
    }

    const admin = await User.findOne({ email: session.user.email });
    const commissionRate = parseInt(process.env.DEFAULT_COMMISSION_RATE) || 7;

    // Create the project
    const project = await Project.create({
      orderId: order._id,
      orderCode: order.orderCode,
      ctvId: order.ctvId,
      customerName: customerName || '',
      websiteType: order.websiteType,
      description: description || order.description,
      zaloGroupLink: zaloGroupLink || '',
      contactLinks: contactLinks || [],
      contractValue: contractValue || 0,
      commissionRate,
      status: 'consulting',
      progress: 20,
      notes: [{
        content: 'Dự án được tạo từ đơn hàng ' + order.orderCode,
        createdBy: admin ? admin._id : null,
        createdAt: new Date(),
        statusChange: { from: null, to: 'consulting' },
      }],
    });

    // Update the order
    order.status = 'approved';
    order.projectId = project._id;
    await order.save();

    // Invalidate related cache keys
    cache.invalidate('projects:*');
    cache.invalidate('orders:*');
    cache.invalidate('stats:*');
    cache.invalidate('users:*');

    return Response.json({
      project,
      message: `Tạo dự án ${project.projectCode} thành công`,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

