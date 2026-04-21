import { connectDB } from '@/lib/db';
import { Admin } from '@/lib/models/Admin';
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password, fullName } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const newAdmin = await Admin.create({
      email,
      password: hashedPassword,
      fullName: fullName || 'Admin',
      role: 'admin',
    });

    const token = generateToken({
      id: newAdmin._id.toString(),
      email: newAdmin.email,
      role: newAdmin.role,
    });

    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: 'Admin registered successfully',
        admin: {
          id: newAdmin._id,
          email: newAdmin.email,
          fullName: newAdmin.fullName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
