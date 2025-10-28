//src/app/api/realizations/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// POST: Create a new draft realization and return the auto-generated ID
export async function POST(req: Request) {
    const body = await req.json();

    const { agentId, storageId = 1, articleId = 0 } = body;

    if (!agentId) {
        return NextResponse.json({ error: "Missing required field: agentId" }, { status: 400 });
    }

    const conn = await pool.getConnection();
    try {
        const [result] = await conn.execute(
            `INSERT INTO StockRealizations
             (agentId, storageId, status, articleId)
             VALUES (?, ?, 'draft', ?)`,
            [Number(agentId), Number(storageId), Number(articleId)]
        ) as any;

        // Get the auto-generated ID from the database
        const realizationId = (result as any).insertId;

        return NextResponse.json({ realizationId: String(realizationId) }, { status: 201 });

    } catch (e: any) {
        console.error("Database error during realization creation:", e);
        return NextResponse.json({ error: "Internal Server Error: " + e.message }, { status: 500 });
    } finally {
        conn.release();
    }
}
