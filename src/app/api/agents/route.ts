// src/app/api/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
    const body = await req.json();

    const {
        // 1. Header
        agentCode,
        isResident = true,

        // 2. Main Info
        isIndividual = true,
        name,
        fullName,
        legalAddress,
        postalAddress,
        phone,
        fiscalCode,
        city,
        regNumber,
        country = 'MD',
        district,

        // 3. Credit & Discount
        creditDays = 0,
        discount = 0.00,
        useIndividualDiscount = false,

        // 5. Bank Accounts
        accounts = [],
    } = body;

    // Validation
    if (!agentCode || !name) {
        return NextResponse.json(
            { error: 'Codul și Denumirea sunt obligatorii!' },
            { status: 400 }
        );
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Insert Agent
        const [agentResult] = await connection.execute(
            `INSERT INTO Agents (
                agentCode, isResident, isIndividual, name, fullName, legalAddress, postalAddress,
                phone, fiscalCode, city, regNumber, country, district,
                creditDays, discount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                agentCode,
                isResident,
                isIndividual,
                name,
                fullName || null,
                legalAddress || null,
                postalAddress || null,
                phone || null,
                fiscalCode || null,
                city || null,
                regNumber || null,
                country,
                district || null,
                creditDays,
                discount,
                useIndividualDiscount,
            ]
        );

        const agentId = (agentResult as any).insertId;

        // 2. Insert Bank Accounts
        if (Array.isArray(accounts) && accounts.length > 0) {
            for (const acc of accounts) {
                const { bankName, iban, swift, isActive = true } = acc;

                if (!bankName || !iban) continue;

                await connection.execute(
                    `INSERT INTO AgentAccounts (agentId, bankName, iban, isActive)
           VALUES (?, ?, ?, ?)`,
                    [agentId, bankName, iban, swift || null, isActive]
                );
            }
        }

        await connection.commit();

        return NextResponse.json(
            { message: 'Agent creat cu succes!', agentId },
            { status: 201 }
        );
    } catch (err: any) {
        await connection.rollback();

        // Handle duplicate agentCode
        if (err.code === 'ER_DUP_ENTRY') {
            return NextResponse.json(
                { error: 'Codul agentului există deja!' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: err.message || 'Eroare la salvarea agentului' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}