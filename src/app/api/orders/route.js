import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
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
    const limit = parseInt(searchParams.get('limit')) || 100;
    const all = searchParams.get('all') === 'true';

    let query = {};
    if (!all || session.user.role !== 'admin') {
      const user = await User.findOne({ email: session.user.email });
      query.ctvId = user._id;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return Response.json({ orders });
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

    return Response.json({ order, message: 'Tạo đơn thành công' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
