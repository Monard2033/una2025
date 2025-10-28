"use client";

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
// The environment can't resolve 'next/navigation'.
// Since this page uses the dynamic route [id], we must get the ID directly from the browser's URL
// if running outside a standard Next.js setup, or simulate it.
// However, since we rely on `useParams`, we must assume a working setup.
// A more robust solution for the current environment is often preferred if the Next.js hooks fail.
// For now, I will keep the original import as it is required in a Next.js environment
// and assume the error is related to the specific build environment setup.

// If the environment supports it, this import is correct:
import { useParams } from 'next/navigation';


// --- Type Definitions (Must match the data fetched from API) ---

interface ReceiptItem {
    articleCode: string;
    nomenclature: string;
    quantity: number;
    unitPrice: number;
    vatPercent: number;
    lineTotal: number;
}

interface ReceiptData {
    realizationId: string;
    documentNumber: string;
    documentDate: string;
    fromStorageName: string;
    toStorageName: string;
    agentName: string;
    totalAmount: number;
    totalVAT: number;
    items: ReceiptItem[];
}

// --- Component ---

export default function ReceiptPrintPage() {
    const params = useParams();
    // Safely retrieve the ID, as params.id can be a string, array, or undefined
    const docId = Array.isArray(params.id) ? params.id[0] : (params.id as string || '');

    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Helper function to simulate currency formatting (RON/MDL/etc.)
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'MDL' }).format(value);

    // Helper to format date/time
    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    useEffect(() => {
        if (!docId) {
            setError("ID-ul documentului este lipsă.");
            setLoading(false);
            return;
        }

        const fetchReceiptData = async () => {
            setLoading(true);
            try {
                // Fetch the receipt details
                const res = await fetch(`/api/receipt?docId=${docId}`);

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(errorText || "Eroare la preluarea datelor bonului.");
                }

                const data: ReceiptData = await res.json();
                setReceiptData(data);

                // Automatically trigger print dialog after data loads
                // A slight delay ensures the browser renders everything first.
                // We use a small timeout to ensure the DOM is painted before printing.
                setTimeout(() => window.print(), 500);

            } catch (err: any) {
                console.error("Fetch error:", err);
                // Check if the error is due to JSON parsing (meaning API might have returned plain HTML/text)
                const errorMessage = err.message.includes('JSON') ? "Eroare de rețea sau răspuns neașteptat de la server." : err.message;
                setError(errorMessage || "Eroare necunoscută la preluarea datelor.");
            } finally {
                setLoading(false);
            }
        };

        fetchReceiptData();
    }, [docId]);

    // --- Print-Optimized Styles ---
    const printStyles = `
        @page {
            size: 58mm auto; /* Typical receipt width (58mm or 80mm) */
            margin: 0;
        }
        body {
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 11px;
            background: #fff !important; /* Force white background for printing */
            margin: 0;
            padding: 0;
        }
        .receipt-container {
            width: 58mm;
            max-width: 58mm;
            padding: 10px;
            box-sizing: border-box;
            line-height: 1.3;
            margin: 0 auto;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .dashed-line { 
            border-top: 1px dashed #000; 
            margin: 5px 0;
            height: 0; 
        }
        .item-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .item-details { width: 100%; }
        .item-qty { width: 25%; text-align: right; }
        .item-price { width: 25%; text-align: right; }
        .item-total { width: 25%; text-align: right; }
        
        @media screen {
            /* Styles only for screen (before printing) */
            .receipt-container {
                border: 1px solid #ccc;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
        }
    `;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Se încarcă bonul...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-10 text-center text-red-600">
                Eroare: {error}
            </div>
        );
    }

    if (!receiptData) {
        return <div className="p-10 text-center">Nu s-au găsit date pentru bonul #{docId}.</div>;
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: printStyles }} />
            <div className="receipt-container">
                <div className="text-center font-bold text-lg mb-2">COMPANIE SRL</div>
                <div className="text-center mb-3">
                    Adresa: Str. Centrală, nr. 1<br />
                    IDNO: 1000100010001
                </div>

                <div className="dashed-line"></div>

                <div className="text-center font-bold mb-1">BON FISCAL (TRANSFER)</div>
                <div className="text-center mb-3">
                    Nr. Bon: **{receiptData.documentNumber || receiptData.realizationId}**
                </div>

                <div className="item-row">
                    <span>Data/Ora:</span>
                    <span className="text-right">{formatDateTime(receiptData.documentDate)}</span>
                </div>
                <div className="item-row">
                    <span>Vânzător:</span>
                    <span className="text-right">{receiptData.agentName || 'Necunoscut'}</span>
                </div>
                <div className="item-row">
                    <span>Sursa:</span>
                    <span className="text-right">{receiptData.fromStorageName}</span>
                </div>
                <div className="item-row mb-3">
                    <span>Destinația:</span>
                    <span className="text-right">{receiptData.toStorageName}</span>
                </div>

                <div className="dashed-line"></div>

                {/* Table Header (Mimicked) */}
                <div className="item-row font-bold">
                    <span className="item-details" style={{ width: '40%' }}>Produs</span>
                    <span className="item-qty">Cant.</span>
                    <span className="item-price">Preț</span>
                    <span className="item-total">Total</span>
                </div>
                <div className="dashed-line"></div>

                {/* Items */}
                {receiptData.items.map((item, index) => (
                    <div key={index} className="mb-2">
                        {/* Nomenclature Line */}
                        <div>{item.nomenclature}</div>
                        {/* Details Line: Qty x Price = Total */}
                        <div className="item-row" style={{ paddingLeft: '5px' }}>
                            <span className="item-details" style={{ width: '40%', fontSize: '0.9em' }}>
                                {item.articleCode}
                            </span>
                            <span className="item-qty">{item.quantity.toFixed(3)}</span>
                            <span className="item-price">{item.unitPrice.toFixed(2)}</span>
                            <span className="item-total font-bold">{item.lineTotal.toFixed(2)}</span>
                        </div>
                    </div>
                ))}

                <div className="dashed-line"></div>

                {/* Totals */}
                <div className="item-row font-bold text-base">
                    <span>TOTAL FĂRĂ TVA:</span>
                    <span className="text-right">{formatCurrency(receiptData.totalAmount - receiptData.totalVAT)}</span>
                </div>
                <div className="item-row">
                    <span>TVA (20%):</span>
                    <span className="text-right">{formatCurrency(receiptData.totalVAT)}</span>
                </div>
                <div className="item-row font-extrabold text-lg">
                    <span>TOTAL GENERAL:</span>
                    <span className="text-right">{formatCurrency(receiptData.totalAmount)}</span>
                </div>

                <div className="dashed-line"></div>

                <div className="text-center mt-3">
                    Vă mulțumim!<br />
                    www.companie.md
                </div>
            </div>
        </>
    );
}
