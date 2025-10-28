import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const articleId = searchParams.get('articleId');
    const storageId = searchParams.get('storage');

    if (!from || !to) {
        return NextResponse.json({ error: 'Perioada este obligatorie' }, { status: 400 });
    }

    let query = `
        SELECT
            -- Aggregated results: use MAX for non-aggregated text fields
            MAX(sr.createdAt) AS date,
            si.nomenclature,
            -- 💡 AGGREGATION: SUM the quantity and total
            SUM(si.quantity) AS quantity,
            si.unitPrice,
            SUM(si.quantity * si.unitPrice) AS total,
            MAX(st.name) AS storageName
        FROM StockRealizations sr
                 JOIN stockitems si ON sr.realizationId = si.realizationId
                 JOIN Storages st ON sr.storageId = st.id
        WHERE sr.status = 'confirmed' AND DATE(sr.createdAt) BETWEEN ? AND ?
    `;

    const params: any[] = [from, to];

    if (articleId) {
        query += ` AND si.articleCode LIKE ?`;
        params.push(`%${articleId}%`);
    }

    if (storageId && storageId !== 'all') {
        query += ` AND sr.storageId = ?`;
        params.push(storageId);
    }

    query += `
        GROUP BY 
            si.nomenclature, si.unitPrice
    `;

    query += ` ORDER BY MAX(sr.createdAt) DESC, si.nomenclature`;

    try {
        const [rows] = await pool.query(query, params) as any[];

        if (rows.length === 0) {
            return NextResponse.json({ items: [], totals: { quantity: 0, amount: 0 } });
        }

        const items = rows.map((r: any) => ({
            date: r.date,
            nomenclature: r.nomenclature,
            storage: r.storageName,
            quantity: Number(r.quantity),
            unitPrice: Number(r.unitPrice),
            total: Number(r.total),
        }));

        const totals = {
            quantity: items.reduce((s: any, i: { quantity: any; }) => s + i.quantity, 0),
            amount: items.reduce((s: any, i: { total: any; }) => s + i.total, 0),
        };

        return NextResponse.json({ items, totals });
    } catch (err: any) {
        console.error("Report Generation Error:", err.message);
        return NextResponse.json({ error: `Eroare baza de date: ${err.message}` }, { status: 500 });
    }
}
