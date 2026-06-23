import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';

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

    let query = {};
    if (!all || session.user.role !== 'admin') {
      const user = await User.findOne({ email: session.user.email });
      query.ctvId = user._id;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const projects = await Project.find(query)
      .populate('ctvId', 'name email phone avatar bankName bankAccountNumber bankAccountName qrCodeImage')
      .populate('orderId', 'orderCode websiteType description')
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ projects });
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
        createdBy: admin._id,
        createdAt: new Date(),
        statusChange: { from: null, to: 'consulting' },
      }],
    });

    // Update the order
    order.status = 'approved';
    order.projectId = project._id;
    await order.save();

    return Response.json({
      project,
      message: `Tạo dự án ${project.projectCode} thành công`,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
