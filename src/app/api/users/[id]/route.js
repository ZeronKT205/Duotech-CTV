import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
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

    const user = await User.findById(id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (body.role !== undefined) {
      if (!['admin', 'ctv'].includes(body.role)) {
        return Response.json({ error: 'Vai trò không hợp lệ' }, { status: 400 });
      }
      // Prevent an admin from removing their own admin role (avoid self lock-out)
      if (id === session.user.dbId && body.role !== 'admin') {
        return Response.json({ error: 'Bạn không thể tự hạ quyền của chính mình' }, { status: 400 });
      }
      user.role = body.role;
    }

    if (body.isActive !== undefined) user.isActive = body.isActive;

    await user.save();

    // Invalidate related cache keys
    cache.invalidate('users:*');

    return Response.json({ user, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('PATCH /api/users/[id] error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

