// src/app/api/realizations/[id]/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

interface ItemData {
    articleCode: string;
    quantity: number;
    unitPrice?: number;
    vatPercent?: number;
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // ← Promise!
) {
    try {
        // AWAIT params
        const { id } = await params;
        const realizationId = Number(id);

        if (isNaN(realizationId)) {
            return NextResponse.json({ error: 'ID invalid' }, { status: 400 });
        }

        const { items }: { items: ItemData[] } = await req.json();

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Items lipsă' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Optional: Clear old items
            await connection.execute(
                `DELETE FROM StockMovements WHERE realizationId = ?`,
                [realizationId]
            );

            // Insert new items
            for (const item of items) {
                await connection.execute(
                    `INSERT INTO StockMovements 
           (realizationId, articleCode, quantity, unitPrice, vatPercent)
           VALUES (?, ?, ?, ?, ?)`,
                    [
                        realizationId,
                        item.articleCode,
                        item.quantity,
                        item.unitPrice ?? 0,
                        item.vatPercent ?? 20
                    ]
                );
            }

            await connection.commit();
            return NextResponse.json({ ok: true }, { status: 200 });
        } catch (err: any) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error('PUT /api/realizations/[id]/items error:', error);
        return NextResponse.json({ error: 'Eroare server' }, { status: 500 });
    }
}