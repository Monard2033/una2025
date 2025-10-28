// src/app/print/invoice/[id]/page.tsx
import { notFound } from 'next/navigation';
import pool from '@/lib/db';

interface Props {
    params: { id: string };
}

export default async function InvoicePrint({ params }: Props) {
    const id = parseInt(params.id);
    if (isNaN(id)) notFound();

    const [realRows] = await pool.query(
        `SELECT sr.*, a.name AS agentName, a.fiscalCode, a.legalAddress 
     FROM StockRealizations sr
     JOIN Agents a ON sr.agentId = a.id
     WHERE sr.agentId = ?`,
        [id]
    ) as any[];

    const [items] = await pool.query(
        `SELECT * FROM StockItems WHERE realizationId = ?`,
        [id]
    ) as any[];

    if (!realRows.length || !items.length) notFound();

    const data = realRows[0];
    const total = items.reduce((s: number, i: any) => s + i.lineTotal, 0);
    const vat = items.reduce((s: number, i: any) => s + i.vatValue, 0);
    const grand = total + vat;

    return (
        <>
            <div className="p-8 max-w-4xl mx-auto font-sans text-sm">
                <h1 className="text-2xl font-bold text-center mb-6">FACTURĂ FISCALĂ</h1>
                <h2 className="text-lg font-medium mb-4">
                    Numar Contract: {data.documentNumber}
                </h2>
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <strong>Furnizor:</strong><br />
                        UNA@MD SRL<br />
                        IDNO: 1015600001234<br />
                        Chișinău, str. Example 123
                    </div>
                    <div>
                        <strong>Cumpărător:</strong><br />
                        {data.agentName}<br />
                        IDNO: {data.fiscalCode}<br />
                        {data.legalAddress || '—'}
                    </div>
                </div>

                <table className="w-full border-collapse border border-gray-800 mb-6">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="border border-gray-800 p-2">Nr.</th>
                        <th className="border border-gray-800 p-2">Denumire</th>
                        <th className="border border-gray-800 p-2 text-right">Cant.</th>
                        <th className="border border-gray-800 p-2 text-right">Preț</th>
                        <th className="border border-gray-800 p-2 text-right">TVA %</th>
                        <th className="border border-gray-800 p-2 text-right">Val. fără TVA</th>
                        <th className="border border-gray-800 p-2 text-right">TVA</th>
                        <th className="border border-gray-800 p-2 text-right">Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    {items.map((item: any, i: number) => (
                        <tr key={i}>
                            <td className="border border-gray-400 p-2 text-center">{i + 1}</td>
                            <td className="border border-gray-400 p-2">{item.nomenclature}</td>
                            <td className="border border-gray-400 p-2 text-right">{item.quantity}</td>
                            <td className="border border-gray-400 p-2 text-right">{Number(item.unitPrice).toFixed(2)}</td>
                            <td className="border border-gray-400 p-2 text-right">{item.vatPercent}</td>
                            <td className="border border-gray-400 p-2 text-right">{item.lineTotal.toFixed(2)}</td>
                            <td className="border border-gray-400 p-2 text-right">{item.vatValue.toFixed(2)}</td>
                            <td className="border border-gray-400 p-2 text-right">
                                {(item.lineTotal + item.vatValue).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div className="text-right font-bold space-y-1">
                    <div>Total fără TVA: {total.toFixed(2)} MDL</div>
                    <div>TVA: {vat.toFixed(2)} MDL</div>
                    <div className="text-lg">TOTAL DE PLATĂ: {grand.toFixed(2)} MDL</div>
                </div>

                <div className="flex justify-between mt-12 text-sm">
                    <div>____________________<br />Furnizor</div>
                    <div>____________________<br />Cumpărător</div>
                </div>
            </div>

            <script
                dangerouslySetInnerHTML={{
                    __html: `
            window.onload = () => {
              setTimeout(() => window.print(), 500);
            };
            window.onafterprint = () => window.close();
          `,
                }}
            />
        </>
    );
}