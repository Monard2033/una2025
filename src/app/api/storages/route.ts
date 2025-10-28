import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
    // You can optionally add a filter here, e.g., WHERE isActive = 1, if needed
    const query = `
        SELECT
            id,
            name
        FROM Storages
    `;

    try {
        const [rows] = await pool.query(query) as any[];

        // Map the rows to a clean format
        const storages = rows.map((r: any) => ({
            id: String(r.id), // Ensure ID is a string for the Select component
            name: r.name,
        }));

        return NextResponse.json(storages);
    } catch (err: any) {
        // Log the error for debugging
        console.error("Database error fetching storages:", err.message);
        return NextResponse.json({ error: 'Eroare la preluarea depozitelor.' }, { status: 500 });
    }
}
