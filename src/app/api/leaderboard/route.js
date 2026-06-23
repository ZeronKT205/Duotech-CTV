import connectDB from '@/lib/mongodb';
import Commission from '@/lib/models/Commission';
import User from '@/lib/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Aggregate paid commissions per ctvId
    const realCommissions = await Commission.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: '$ctvId',
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Fetch user details for these CTVs, selecting ONLY name and avatar
    const ctvIds = realCommissions.map(c => c._id).filter(id => id);
    const users = await User.find({ _id: { $in: ctvIds } }, 'name avatar').lean();
    const usersMap = new Map(users.map(u => [u._id.toString(), u]));

    // Format real users list, strictly conforming to the privacy constraint (only name, avatar, and totalAmount)
    // Real amounts are multiplied by 4 to align with the virtual earners multiplier.
    const realLeaderboard = realCommissions
      .map(c => {
        const user = c._id ? usersMap.get(c._id.toString()) : null;
        if (!user) return null;
        return {
          name: user.name,
          avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
          totalAmount: c.totalAmount * 4
        };
      })
      .filter(u => u !== null);

    // 10 virtual users with uploaded real avatars from Cloudflare R2 and 4x increased revenues (highest: 314,000,000 VND)
    const virtualLeaderboard = [
      { name: 'Nguyễn Minh Triết', avatar: '/api/uploads?key=uploads%2Favt-1782206546881-0.jpg', totalAmount: 314000000 },
      { name: 'Lê Thị Mai Chi', avatar: '/api/uploads?key=uploads%2Favt-1782206547632-1.jpg', totalAmount: 256800000 },
      { name: 'Trần Hoàng Nam', avatar: '/api/uploads?key=uploads%2Favt-1782206548323-2.jpg', totalAmount: 211200000 },
      { name: 'Phạm Thùy Dung', avatar: '/api/uploads?key=uploads%2Favt-1782206548702-3.jpg', totalAmount: 183600000 },
      { name: 'Hoàng Quốc Anh', avatar: '/api/uploads?key=uploads%2Favt-1782206549059-4.jpg', totalAmount: 153600000 },
      { name: 'Đặng Minh Huy', avatar: '/api/uploads?key=uploads%2Favt-1782206549463-5.jpg', totalAmount: 119000000 },
      { name: 'Đỗ Thanh Hằng', avatar: '/api/uploads?key=uploads%2Favt-1782206549918-6.jpg', totalAmount: 88400000 },
      { name: 'Vũ Hoài Lâm', avatar: '/api/uploads?key=uploads%2Favt-1782206550350-7.jpg', totalAmount: 62400000 },
      { name: 'Ngô Bích Phương', avatar: '/api/uploads?key=uploads%2Favt-1782206550723-8.jpg', totalAmount: 47200000 },
      { name: 'Bùi Tiến Dũng', avatar: '/api/uploads?key=uploads%2Favt-1782206551059-9.jpg', totalAmount: 33600000 }
    ];

    // Combine both lists
    const combinedList = [...realLeaderboard, ...virtualLeaderboard];

    // Sort by totalAmount descending
    combinedList.sort((a, b) => b.totalAmount - a.totalAmount);

    // Limit to the top 10 highest earners
    const topTenList = combinedList.slice(0, 10);

    return Response.json({ leaderboard: topTenList });
  } catch (error) {
    console.error('GET /api/leaderboard error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
