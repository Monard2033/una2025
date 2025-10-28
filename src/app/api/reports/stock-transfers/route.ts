import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// --- Type Definitions ---

interface TransferItem {
    articleCode: string;
    nomenclature: string;
    quantity: number;
}

interface TransferDocument {
    docId: string;
    documentDate: string;
    fromStorageId: string;
    toStorageId: string;
    items: TransferItem[]; // Note: This structure is now complex to extract from the single row table
}

// Based on your image, we'll use a simplified structure that requires less aggregation
interface RawTransferRow extends RowDataPacket {
    docId: string;
    realizationId: string;
    documentDate: Date;
    fromStorageId: string;
    toStorageId: string;
    fromStorageName: string;
    toStorageName: string;
    articleCode: string;
    nomenclature: string;
    quantity: number;
}

/**
 * GET /api/stock-transfers-report?storageId={id}
 * Retrieves a list of stock transfer documents from the simplified log table.
 */
export async function GET(req: NextRequest) {
    let connection = null;
    try {
        const url = new URL(req.url);
        const selectedStorageId = url.searchParams.get('storageId');

        if (!selectedStorageId) {
            return NextResponse.json({ error: 'ID-ul depozitului este obligatoriu.' }, { status: 400 });
        }

        connection = await pool.getConnection();

        // Query: Select all 'transfer' movements where the selected storage ID is EITHER the source OR the destination.
        // We join `storages` twice to get the names for both source (S_FROM) and destination (S_TO).
        const [rawTransfers] = await connection.query<RawTransferRow[]>(
            `
            SELECT 
                CAST(SM.id AS CHAR) AS docId, -- Using the row ID as a unique document identifier (or use realizationId if available and unique per transfer)
                SM.realizationId,
                SM.createdAt AS documentDate,
                SM.fromStorageId,
                SM.toStorageId,
                S_FROM.name AS fromStorageName,
                S_TO.name AS toStorageName,
                SM.articleCode,
                SM.nomenclature,
                SM.quantity
            FROM stockmovements SM
            INNER JOIN storages S_FROM ON S_FROM.id = SM.fromStorageId
            INNER JOIN storages S_TO ON S_TO.id = SM.toStorageId
            WHERE 
                SM.movementType = 'transfer' AND
                (SM.fromStorageId = ? OR SM.toStorageId = ?)
            ORDER BY SM.createdAt DESC
            `,
            [selectedStorageId, selectedStorageId]
        );

        // --- Post-process the data in TypeScript: Group by realizationId ---
        // Since one document (realizationId) can have multiple items (rows in stockmovements),
        // we need to group them into the TransferDocument structure expected by the frontend.
        const documentMap = new Map<string, TransferDocument>();

        rawTransfers.forEach(row => {
            const realizationId = row.realizationId.toString();

            if (!documentMap.has(realizationId)) {
                // Initialize the document if it's the first time seeing this realizationId
                documentMap.set(realizationId, {
                    docId: realizationId, // Using realizationId as the primary document ID
                    documentDate: row.documentDate.toISOString(),
                    fromStorageId: row.fromStorageId,
                    toStorageId: row.toStorageId,
                    items: [],
                    // Temporarily add names for client side use (not part of the interface, but helpful)
                    fromStorageName: row.fromStorageName,
                    toStorageName: row.toStorageName,
                } as any as TransferDocument);
            }

            // Add the current row's item to the document's item list
            const document = documentMap.get(realizationId)!;
            document.items.push({
                articleCode: row.articleCode,
                nomenclature: row.nomenclature,
                quantity: row.quantity,
            });
        });

        const documents = Array.from(documentMap.values());

        connection.release();
        return NextResponse.json(documents, { status: 200 });

    } catch (error: any) {
        if (connection) connection.release();
        console.error("Error fetching stock transfer report:", error);
        // Ensure error message is friendly
        return NextResponse.json({ error: 'Eroare internă la preluarea raportului: ' + error.message }, { status: 500 });
    }
}
