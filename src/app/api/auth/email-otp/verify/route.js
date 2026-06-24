import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Otp from '@/lib/models/Otp';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email và mã xác thực là bắt buộc' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();

    // Find the latest OTP for this email
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Mã xác thực đã hết hạn. Vui lòng gửi lại mã mới.' },
        { status: 400 }
      );
    }

    // Check max attempts
    if (otpRecord.attempts >= 5) {
      await Otp.deleteMany({ email: normalizedEmail });
      return NextResponse.json(
        { error: 'Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới.' },
        { status: 429 }
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp.trim()) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      return NextResponse.json(
        { error: `Mã xác thực không đúng. Bạn còn ${remaining} lần thử.` },
        { status: 400 }
      );
    }

    // OTP is correct — delete all OTPs for this email
    await Otp.deleteMany({ email: normalizedEmail });

    return NextResponse.json({
      success: true,
      verified: true,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
