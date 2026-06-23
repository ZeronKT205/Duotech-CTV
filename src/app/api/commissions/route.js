import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Commission from '@/lib/models/Commission';
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

    let query = {};
    if (!all || session.user.role !== 'admin') {
      const user = await User.findOne({ email: session.user.email });
      query.ctvId = user._id;
    }

    const commissions = await Commission.find(query)
      .populate('ctvId', 'name email bankName bankAccountNumber bankAccountName qrCodeImage')
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ commissions });
  } catch (error) {
    console.error('GET /api/commissions error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
