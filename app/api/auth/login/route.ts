import { connectDB } from '@/lib/db';
import { Admin } from '@/lib/models/Admin';
import { comparePassword, generateToken, setAuthCookie } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateToken({
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    });

    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: 'Login successful',
        admin: {
          id: admin._id,
          email: admin.email,
          fullName: admin.fullName,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
