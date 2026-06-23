import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).lean();

    return Response.json({ user });
  } catch (error) {
    console.error('GET /api/users/profile error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { phone, bankName, bankAccountNumber, bankAccountName, qrCodeImage } = body;

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (phone !== undefined) user.phone = phone;
    if (bankName !== undefined) user.bankName = bankName;
    if (bankAccountNumber !== undefined) user.bankAccountNumber = bankAccountNumber;
    if (bankAccountName !== undefined) user.bankAccountName = bankAccountName;
    if (qrCodeImage !== undefined) user.qrCodeImage = qrCodeImage;

    await user.save();

    return Response.json({ user, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('PUT /api/users/profile error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
