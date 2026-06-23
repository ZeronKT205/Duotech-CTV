import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Setting from '@/lib/models/Setting';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const commissionRateSetting = await Setting.findOne({ key: 'commission_rate' });

    return Response.json({
      settings: {
        commissionRate: commissionRateSetting?.value || parseInt(process.env.DEFAULT_COMMISSION_RATE) || 7,
      }
    });
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { commissionRate } = body;

    if (commissionRate !== undefined) {
      await Setting.findOneAndUpdate(
        { key: 'commission_rate' },
        { key: 'commission_rate', value: commissionRate },
        { upsert: true, new: true }
      );
    }

    return Response.json({ message: 'Cập nhật cài đặt thành công' });
  } catch (error) {
    console.error('PUT /api/settings error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
