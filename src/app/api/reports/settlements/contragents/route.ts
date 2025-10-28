//src/app/api/realizations/[id]/print/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const agentId = searchParams.get('agentId');

    if (!date || !agentId) {
        return NextResponse.json({ error: 'Data și Contragentul sunt obligatorii.' }, { status: 400 });
    }

    // Agent names are hardcoded based on the IDs provided in the frontend for display purposes
    const AGENT_NAMES: { [key: string]: string } = {
        '00064': 'Persoană fizică',
        '00065': 'Plată terminal',
    };

    const query = `
        SELECT
            sr.agentId,
            SUM(sr.totalAmount) AS totalAmount
        FROM StockRealizations sr
        WHERE
            sr.status = 'confirmed'
          AND sr.agentId = ?
          AND DATE(sr.createdAt) = ?
        GROUP BY sr.agentId
    `;

    // The parameters are agentId and the date
    const params: any[] = [agentId, date];

    try {
        const [rows] = await pool.query(query, params) as any[];

        if (rows.length === 0) {
            return NextResponse.json({ items: [] });
        }

        // Map database results, ensuring totalAmount is a number and adding the name
        const items = rows.map((r: any) => ({
            agentId: String(r.agentId),
            agentName: AGENT_NAMES[String(r.agentId)] || `Cod Necunoscut (${r.agentId})`,
            totalAmount: Number(r.totalAmount),
        }));

        return NextResponse.json({ items });
    } catch (err: any) {
        console.error("Report Vanzari Agenti Error:", err.message);
        return NextResponse.json({ error: `Eroare baza de date: ${err.message}` }, { status: 500 });
    }
}
