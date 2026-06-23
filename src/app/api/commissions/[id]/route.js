import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Commission from '@/lib/models/Commission';
import User from '@/lib/models/User';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status, note, billImage, paidNote } = body;

    const admin = await User.findOne({ email: session.user.email });

    const commission = await Commission.findById(id);
    if (!commission) {
      return Response.json({ error: 'Commission not found' }, { status: 404 });
    }

    if (status === 'paid') {
      commission.status = 'paid';
      commission.paidAt = new Date();
      commission.paidBy = admin._id;
      if (billImage) commission.billImage = billImage;
      if (paidNote) commission.paidNote = paidNote;
    }
    if (note !== undefined) commission.note = note;

    await commission.save();

    return Response.json({ commission, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('PATCH /api/commissions/[id] error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
