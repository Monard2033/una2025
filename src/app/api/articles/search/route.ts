// src/app/api/articles/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code')?.trim();

    if (!code) {
        return NextResponse.json({ error: 'Cod lipsă' }, { status: 400 });
    }

    try {
        const [rows] = await pool.query(
            `SELECT 
         articleCode, 
         nomenclature, 
         defaultPrice, 
         vatPercent 
       FROM StockBalance 
       WHERE articleCode = ? 
       LIMIT 1`,
            [code]
        ) as any[];

        if (!rows.length) {
            return NextResponse.json({ error: 'Articol negăsit' }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}