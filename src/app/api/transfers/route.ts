// src/app/api/transfers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface TransferItem {
    articleCode: string;
    quantity: number;
}

interface TransferPayload {
    from: string;
    to: string;
    items: TransferItem[];
    realizationId: string; // ← REQUIRED
}

export async function POST(req: NextRequest) {
    let connection;

    try {
        const payload: TransferPayload = await req.json();
        const { from: fromStorageId, to: toStorageId, items } = payload;

        // VALIDATION
        if (!fromStorageId || !toStorageId || items.length === 0) {
            return NextResponse.json({ error: 'Date insuficiente (inclusiv realizationId).' }, { status: 400 });
        }
        if (fromStorageId === toStorageId) {
            return NextResponse.json({ error: 'Depozitul sursă nu poate fi identic cu destinația.' }, { status: 400 });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const missingItems: string[] = [];

        for (const item of items) {
            const { articleCode, quantity } = item;
            if (quantity <= 0) continue;

            const [sourceRows] = await connection.query<RowDataPacket[]>(
                `SELECT quantity, nomenclature, defaultPrice, vatPercent
                 FROM stockbalance
                 WHERE storageId = ? AND articleCode = ?`,
                [fromStorageId, articleCode]
            );

            if (sourceRows.length === 0 || sourceRows[0].quantity < quantity) {
                const [availableRows] = await connection.query<RowDataPacket[]>(
                    `SELECT s.name AS storageName, sb.quantity
                     FROM stockbalance sb
                              JOIN storages s ON sb.storageId = s.id
                     WHERE sb.articleCode = ? AND sb.quantity > 0
                     ORDER BY sb.quantity DESC`,
                    [articleCode]
                );

                const available = availableRows
                    .map((r: any) => `${r.storageName} (${r.quantity} buc)`)
                    .join(', ') || 'niciun depozit';

                missingItems.push(
                    `Articolul ${articleCode} nu este disponibil în depozitul sursă. Disponibil în: ${available}.`
                );
                continue; // Skip transfer, but don't rollback yet
            }

            const { nomenclature = "Necunoscut", defaultPrice = 0, vatPercent = 20 } = sourceRows[0];

            // 1. DEDUCT FROM SOURCE (stockbalance)
            await connection.execute(
                `UPDATE stockbalance SET quantity = quantity - ? WHERE storageId = ? AND articleCode = ?`,
                [quantity, fromStorageId, articleCode]
            );

            // 2. ADD TO DESTINATION (stockbalance)
            const [destRows] = await connection.query<RowDataPacket[]>(
                `SELECT id FROM stockbalance WHERE storageId = ? AND articleCode = ?`,
                [toStorageId, articleCode]
            );

            if (destRows.length > 0) {
                await connection.execute(
                    `UPDATE stockbalance SET quantity = quantity + ? WHERE storageId = ? AND articleCode = ?`,
                    [quantity, toStorageId, articleCode]
                );
            } else {
                await connection.execute(
                    `INSERT INTO stockbalance 
           (storageId, articleCode, nomenclature, quantity, defaultPrice, vatPercent)
           VALUES (?, ?, ?, ?, ?, ?)`,
                    [toStorageId, articleCode, nomenclature, quantity, defaultPrice, vatPercent]
                );
            }

            // 3. WRITE TO stockmovements (NEW!)
            await connection.execute(
                `INSERT INTO stockmovements 
         (storageId, articleCode, nomenclature, quantity, 
          unitPrice, vatPercent, fromStorageId, toStorageId, movementType)
         VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, 'transfer')`,
                [
                    toStorageId, // or fromStorageId – your choice (kept for compatibility)
                    articleCode,
                    nomenclature,
                    quantity,
                    defaultPrice,
                    vatPercent,
                    fromStorageId,
                    toStorageId
                ]
            );
        }

        if (missingItems.length > 0) {
            await connection.rollback();
            return NextResponse.json({ error: missingItems.join(' ') }, { status: 400 });
        }

        await connection.commit();
        return NextResponse.json({ message: 'Mutare stoc efectuată cu succes.' }, { status: 200 });

    } catch (err: any) {
        if (connection) await connection.rollback();
        console.error('%c[API ERROR]', 'color: #D32F2F;', err.message);
        return NextResponse.json({ error: 'Eroare internă: ' + err.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}