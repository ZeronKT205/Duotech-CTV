import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    CredentialsProvider({
      id: 'email-otp',
      name: 'Email OTP',
      credentials: {
        email: { label: "Email", type: "text" },
        otp: { label: "OTP", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) {
          throw new Error('Email và mã xác thực là bắt buộc');
        }

        const email = credentials.email.toLowerCase().trim();

        // Verify OTP via internal API
        const { default: OtpModel } = await import('@/lib/models/Otp');
        await connectDB();

        const otpRecord = await OtpModel.findOne({
          email,
          expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
          throw new Error('Mã xác thực đã hết hạn');
        }

        if (otpRecord.attempts >= 5) {
          await OtpModel.deleteMany({ email });
          throw new Error('Bạn đã nhập sai quá nhiều lần');
        }

        if (otpRecord.otp !== credentials.otp.trim()) {
          otpRecord.attempts += 1;
          await otpRecord.save();
          throw new Error('Mã xác thực không đúng');
        }

        // OTP verified — clean up
        await OtpModel.deleteMany({ email });

        // Find or create user (merge with existing Google account by email)
        let user = await User.findOne({ email });
        if (!user) {
          const isAdmin = email === process.env.ADMIN_EMAIL;
          user = await User.create({
            email,
            name: email.split('@')[0],
            avatar: '',
            role: isAdmin ? 'admin' : 'ctv',
            isActive: true,
          });
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.avatar || null,
          role: user.role,
        };
      }
    }),
    CredentialsProvider({
      id: 'dev-bypass',
      name: 'Developer Bypass',
      credentials: {
        email: { label: "Email", type: "text" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        await connectDB();
        
        let email = credentials.email || 'ctv@duotech.vn';
        let role = credentials.role || 'ctv';
        
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            email,
            name: email.split('@')[0].toUpperCase(),
            avatar: '',
            role,
            isActive: true,
          });
        } else {
          if (role && user.role !== role) {
            user.role = role;
            await user.save();
          }
        }
        
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.avatar || null,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'email-otp' || account?.provider === 'dev-bypass' || account?.provider === 'credentials') {
        return true;
      }
      try {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          const isAdmin = user.email === process.env.ADMIN_EMAIL;
          await User.create({
            email: user.email,
            name: user.name,
            avatar: user.image || '',
            role: isAdmin ? 'admin' : 'ctv',
          });
        } else {
          existingUser.name = user.name;
          existingUser.avatar = user.image || '';
          await existingUser.save();
        }
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return true;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.role = user.role;
        token.dbId = user.id;
      }
      try {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.role = dbUser.role;
          token.dbId = dbUser._id.toString();
          token.isActive = dbUser.isActive;
        }
      } catch (e) {
        // Silently fail
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role || 'ctv';
      session.user.dbId = token.dbId;
      session.user.isActive = token.isActive;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
