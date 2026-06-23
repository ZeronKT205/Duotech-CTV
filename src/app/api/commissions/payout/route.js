import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Commission from '@/lib/models/Commission';
import User from '@/lib/models/User';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { ctvId } = body;

    if (!ctvId) {
      return Response.json({ error: 'Thiếu ctvId' }, { status: 400 });
    }

    const admin = await User.findOne({ email: session.user.email });
    if (!admin) {
      return Response.json({ error: 'Không tìm thấy tài khoản quản trị' }, { status: 404 });
    }

    // Update all pending commissions for this CTV to paid
    const result = await Commission.updateMany(
      { ctvId, status: 'pending' },
      {
        status: 'paid',
        paidAt: new Date(),
        paidBy: admin._id
      }
    );

    return Response.json({
      success: true,
      message: `Đã thanh toán thành công ${result.modifiedCount} đợt hoa hồng`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('POST /api/commissions/payout error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
