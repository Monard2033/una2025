// src/app/api/stock-balance/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) return NextResponse.json([]);

    const [rows] = await pool.query(
        `SELECT s.name AS storage, sb.quantity 
     FROM stockbalance sb
     JOIN storages s ON sb.storageId = s.id
     WHERE sb.articleCode = ? AND sb.quantity > 0
     ORDER BY sb.quantity DESC`,
        [code]
    );

    return NextResponse.json(rows);
}