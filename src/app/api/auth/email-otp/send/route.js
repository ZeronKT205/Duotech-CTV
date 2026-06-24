import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Otp from '@/lib/models/Otp';
import nodemailer from 'nodemailer';

// Lazy-init Nodemailer to avoid build-time error when SMTP config isn't set
let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: parseInt(process.env.SMTP_PORT || '465') === 465, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

// Generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();

    // Rate limit: max 3 OTPs per email per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentOtps = await Otp.countDocuments({
      email: normalizedEmail,
      createdAt: { $gte: tenMinutesAgo },
    });

    if (recentOtps >= 3) {
      return NextResponse.json(
        { error: 'Bạn đã gửi quá nhiều mã. Vui lòng thử lại sau 10 phút.' },
        { status: 429 }
      );
    }

    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email: normalizedEmail });

    // Generate and save new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Otp.create({
      email: normalizedEmail,
      otp,
      expiresAt,
    });

    // Send OTP via email
    try {
      const fromEmail = process.env.SMTP_FROM_EMAIL || `"DuoTech" <${process.env.SMTP_USER}>`;
      await getTransporter().sendMail({
        from: fromEmail,
        to: normalizedEmail,
        subject: 'Mã xác thực đăng nhập DuoTech',
        html: `
          <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #f9f9f6;">
            <div style="background: white; border: 2px solid #0f172a; border-radius: 20px; padding: 40px 32px; box-shadow: 6px 6px 0px #0f172a;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 0;">DUOTECH</h1>
                <p style="color: #64748b; font-size: 14px; margin: 8px 0 0;">Mã xác thực đăng nhập</p>
              </div>
              
              <div style="background: #f8fafc; border: 2px solid #0f172a; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <p style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0052cc; margin: 0;">${otp}</p>
              </div>
              
              <p style="color: #334155; font-size: 14px; line-height: 1.6; text-align: center;">
                Nhập mã này vào trang đăng nhập để tiếp tục.<br>
                Mã có hiệu lực trong <strong>5 phút</strong>.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              
              <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
              </p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('SMTP email send error:', emailError);
      return NextResponse.json(
        { error: 'Không thể gửi email. Vui lòng thử lại.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mã xác thực đã được gửi đến email của bạn',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
