import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface ReceiptItem {
    articleCode: string;
    nomenclature: string;
    quantity: number;
    unitPrice: number;
    vatPercent: number;
    lineTotal: number;
    vatValue: number;
}

interface RawReceiptRow extends RowDataPacket {
    realizationId: string;
    documentNumber: string;
    documentDate: Date;
    fromStorageId: string;
    toStorageId: string;
    totalAmount: number;
    totalVAT: number;
    agentName: string;
    articleCode: string;
    nomenclature: string;
    quantity: number;
    unitPrice: number;
    vatPercent: number;
    lineTotal: number;
    vatValue: number;
    fromStorageName: string;
    toStorageName: string;
}

/**
 * GET /api/receipt-details?docId={id}
 * Fetches all details for a single document (transfer realization).
 */
export async function GET(req: NextRequest) {
    let connection = null;
    try {
        const url = new URL(req.url);
        const docId = url.searchParams.get('realizationId');

        if (!docId) {
            return NextResponse.json({ error: 'ID-ul documentului este obligatoriu.' }, { status: 400 });
        }

        connection = await pool.getConnection();

        const [rawDetails] = await connection.query<RawReceiptRow[]>(
            `
            SELECT 
                SR.realizationId,
                SR.documentNumber,
                SR.createdAt AS documentDate,
                SR.totalAmount,
                SR.totalVAT,
                A.name AS agentName,
                SI.articleCode,
                SI.nomenclature,
                SI.quantity,
                SI.unitPrice,
                SI.vatPercent,
                SI.lineTotal,
                SI.vatValue,
                -- Since this is a transfer receipt, we need to look up storage info from a separate log 
                -- or if SR has from/to storage IDs. Since it likely doesn't, we'll join the stockmovements 
                -- table associated with this realizationId to find the transfer storages.
                (SELECT MIN(storageId) FROM stockmovements WHERE realizationId = SR.realizationId AND movementType = 'transfer') AS fromStorageId,
                (SELECT MAX(storageId) FROM stockmovements WHERE realizationId = SR.realizationId AND movementType = 'transfer') AS toStorageId
            FROM stockrealizations SR
            INNER JOIN stockitems SI ON SI.realizationId = SR.realizationId
            INNER JOIN agents A ON A.id = SR.agentId
            WHERE SR.realizationId = ?
            `,
            [docId]
        );

        if (rawDetails.length === 0) {
            connection.release();
            return NextResponse.json({ error: 'Documentul nu a fost găsit.' }, { status: 404 });
        }

        // Fetch storage names based on IDs found in the subqueries
        const fromStorageId = rawDetails[0].fromStorageId;
        const toStorageId = rawDetails[0].toStorageId;

        let fromStorageName = 'N/A';
        let toStorageName = 'N/A';

        if (fromStorageId && toStorageId) {
            const [storageNames] = await connection.query<RowDataPacket[]>(
                `
                SELECT id, name FROM storages WHERE id IN (?, ?)
                `,
                [fromStorageId, toStorageId]
            );
            const storageMap = new Map<number, string>();
            storageNames.forEach(row => storageMap.set(row.id, row.name));

            fromStorageName = storageMap.get(parseInt(fromStorageId)) || 'N/A';
            toStorageName = storageMap.get(parseInt(toStorageId)) || 'N/A';
        }


        // --- Consolidate Data ---
        const firstRow = rawDetails[0];
        const items: ReceiptItem[] = rawDetails.map(row => ({
            articleCode: row.articleCode,
            nomenclature: row.nomenclature,
            quantity: row.quantity,
            unitPrice: row.unitPrice,
            vatPercent: row.vatPercent,
            lineTotal: row.lineTotal,
            vatValue: row.vatValue,
        }));

        const responseData = {
            realizationId: firstRow.realizationId,
            documentNumber: firstRow.documentNumber || `${firstRow.realizationId}`,
            documentDate: firstRow.documentDate.toISOString(),
            fromStorageName,
            toStorageName,
            agentName: firstRow.agentName,
            totalAmount: firstRow.totalAmount,
            totalVAT: firstRow.totalVAT,
            items: items,
        };

        connection.release();
        return NextResponse.json(responseData, { status: 200 });

    } catch (error: any) {
        if (connection) connection.release();
        console.error("Error fetching receipt details:", error);
        return NextResponse.json({ error: 'Eroare internă la preluarea bonului: ' + error.message }, { status: 500 });
    }
}
