import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        console.log('API: /api/auth/login called');

        const body = await request.json();
        console.log('Request body:', body);

        const { email, password } = body;

        if (!email || !password) {
            console.log('Missing email or password');
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ? AND password = ?',
            [email, password]
        );

        console.log('DB result:', rows);

        if (Array.isArray(rows) && rows.length > 0) {
            console.log('Login success');
            return NextResponse.json({ success: true });
        } else {
            console.log('Invalid credentials');
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
    } catch (error: any) {
        console.error('Login API error:', error);
        return NextResponse.json(
            { error: 'Server error', details: error.message },
            { status: 500 }
        );
    }
}