// src/app/api/realizations/[id]/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const realizationId = BigInt(id);
    const body = await req.json();

    const {
        items = [],
        agentId,
        storageId = 1,
        invoiceNumber,
        documentNumber,
        totalAmount = 0,
        totalVAT = 0,
    } = body;

    if (!agentId || items.length === 0) {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
        await conn.execute(
            `UPDATE stockrealizations SET
                                          agentId = ?,
                                          storageId = ?,
                                          invoiceNumber = ?,
                                          documentNumber = ?,
                                          totalAmount = ?,
                                          totalVAT = ?,
                                          status = 'confirmed',
                                          confirmedAt = NOW()
             WHERE realizationId = ?`,
            [
                agentId,
                storageId,
                invoiceNumber || null,
                documentNumber || null,
                totalAmount,
                totalVAT,
                realizationId,
            ]
        );

        for (const item of items) {
            await conn.execute(
                `INSERT INTO stockitems
                 (realizationId, articleCode, nomenclature, quantity, unitPrice, vatPercent)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    realizationId,
                    item.articleCode,
                    item.nomenclature,
                    item.quantity,
                    item.unitPrice,
                    item.vatPercent,
                ]
            );
        }

        await conn.commit();
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        await conn.rollback();
        return NextResponse.json({ error: e.message }, { status: 500 });
    } finally {
        conn.release();
    }
}