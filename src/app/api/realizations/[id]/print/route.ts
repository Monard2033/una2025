//src/app/api/realizations/[id]/print/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // ← Promise!
) {
    const { id } = await params;
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
        const [rows] = await conn.query(
            `SELECT status FROM StockRealizations WHERE realizationId = ?`,
            [id]
        ) as any[];
        if (!rows.length) throw new Error("Realizare negăsită");
        if (rows[0].status === "confirmed") {
            await conn.commit();
            return NextResponse.json({ message: "Deja confirmată" });
        }

        // confirm + deduct stock
        await conn.execute(`UPDATE StockRealizations SET status='confirmed' WHERE realizationId=?`, [id]);

        await conn.execute(
            `INSERT INTO StockBalance (storageId, articleCode, nomenclature, quantity)
             SELECT sr.storageId, si.articleCode, si.nomenclature, -si.quantity
             FROM StockItems si
                      JOIN StockRealizations sr ON si.realizationId=sr.realizationId
             WHERE si.realizationId=?
             ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
            [id]
        );

        await conn.execute(
            `INSERT INTO StockMovements (realizationId, storageId, articleCode, nomenclature, quantity, movementType)
             SELECT ?, sr.storageId, si.articleCode, si.nomenclature, si.quantity, 'sale'
             FROM StockItems si
                      JOIN StockRealizations sr ON si.realizationId=sr.realizationId
             WHERE si.realizationId=?`,
            [id, id]
        );

        await conn.commit();
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        await conn.rollback();
        return NextResponse.json({ error: e.message }, { status: 500 });
    } finally {
        conn.release();
    }
}