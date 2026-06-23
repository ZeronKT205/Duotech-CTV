import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Commission from '@/lib/models/Commission';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status, contractValue, adminNote, zaloGroupName } = body;

    const order = await Order.findById(id);
    if (!order) {
      return Response.json({ error: 'Đơn hàng không tìm thấy' }, { status: 404 });
    }

    const previousStatus = order.status;

    if (status) order.status = status;
    if (contractValue !== undefined) order.contractValue = contractValue;
    if (adminNote !== undefined) order.adminNote = adminNote;
    if (zaloGroupName !== undefined) order.zaloGroupName = zaloGroupName;

    await order.save();

    // Auto-create commissions when order becomes 'contracted'
    if (status === 'contracted' && previousStatus !== 'contracted' && order.commissionTotal > 0) {
      const existingCommissions = await Commission.find({ orderId: order._id });
      if (existingCommissions.length === 0) {
        const halfAmount = Math.round(order.commissionTotal / 2);
        await Commission.create([
          {
            orderId: order._id,
            orderCode: order.orderCode,
            ctvId: order.ctvId,
            phase: 1,
            amount: halfAmount,
          },
          {
            orderId: order._id,
            orderCode: order.orderCode,
            ctvId: order.ctvId,
            phase: 2,
            amount: order.commissionTotal - halfAmount,
          },
        ]);
      }
    }

    return Response.json({ order, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('PATCH /api/orders/[id] error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
