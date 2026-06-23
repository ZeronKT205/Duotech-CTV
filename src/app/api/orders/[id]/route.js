import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import { cache } from '@/lib/cache';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status, rejectionReason, adminNote } = body;

    const order = await Order.findById(id);
    if (!order) {
      return Response.json({ error: 'Đơn hàng không tìm thấy' }, { status: 404 });
    }

    // Only allow rejecting from pending status
    if (status === 'rejected') {
      if (order.status !== 'pending') {
        return Response.json({ error: 'Chỉ có thể từ chối đơn đang chờ xử lý' }, { status: 400 });
      }
      order.status = 'rejected';
      order.rejectionReason = rejectionReason || '';
    }

    if (adminNote !== undefined) order.adminNote = adminNote;

    await order.save();

    // Invalidate related cache keys
    cache.invalidate('orders:*');
    cache.invalidate('stats:*');
    cache.invalidate('users:*');

    return Response.json({ order, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('PATCH /api/orders/[id] error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

