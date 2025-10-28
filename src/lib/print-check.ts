// src/lib/print-check.ts
import pool from '@/lib/db';

export async function printCheckHTML(realizationId: number) {
    const [rows] = await pool.query(
        `SELECT sr.invoiceNumber, sr.createdAt, a.name AS agentName, a.fiscalCode,
            si.nomenclature, si.quantity, si.unitPrice, (si.quantity * si.unitPrice) AS total
     FROM StockRealizations sr
     JOIN Agents a ON sr.agentId = a.id
     JOIN StockItems si ON sr.realizationId = si.realizationId
     WHERE sr.realizationId = ?
     ORDER BY si.nomenclature`,
        [realizationId]
    ) as any[];

    if (!rows.length) throw new Error("Cecul nu a fost găsit");

    const data = rows[0];
    const items = rows;
    const grandTotal = items.reduce((s: number, i: any) => s + i.total, 0);

    return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Cec ${data.invoiceNumber}</title>
  <style>
    @page { margin: 0.5cm; size: 80mm; }
    body { font-family: Arial,serif; font-size: 9pt; width: 75mm; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 10px; }
    .info { font-size: 8pt; margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 8pt; }
    th, td { border: none; padding: 2px; text-align: left; }
    .total { text-align: right; font-weight: bold; margin-top: 10px; }
    .signature { margin-top: 20px; display: flex; justify-content: space-between; font-size: 8pt; }
    hr { border: 0; border-top: 1px dashed #000; margin: 8px 0; }
  </style>
</head>
<body>
  <div class="header">
    <strong>CEC DE PLATĂ</strong><br>
    <small>UNA@MD SRL • IDNO: 1015600001234</small>
  </div>
  <hr>
  <div class="info"><strong>Nr:</strong> ${data.invoiceNumber}</div>
  <div class="info"><strong>Data:</strong> ${new Date(data.createdAt).toLocaleDateString('ro-MD')}</div>
  <div class="info"><strong>Cumpărător:</strong> ${data.agentName}</div>
  <div class="info"><strong>IDNO:</strong> ${data.fiscalCode || '—'}</div>
  <hr>

  <table>
    <thead>
      <tr><th>Denumire</th><th class="text-right">Cant.</th><th class="text-right">Preț</th><th class="text-right">Total</th></tr>
    </thead>
    <tbody>
      ${items.map((i: { nomenclature: any; quantity: any; unitPrice: any; total: any; }) => `
        <tr>
          <td>${i.nomenclature}</td>
          <td class="text-right">${i.quantity}</td>
          <td class="text-right">${Number(i.unitPrice).toFixed(2)}</td>
          <td class="text-right">${Number(i.total).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total">
    <strong>TOTAL: ${grandTotal.toFixed(2)} MDL</strong>
  </div>

  <div class="signature">
    <div>_________________<br>Furnizor</div>
    <div>_________________<br>Cumpărător</div>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>
  `;
}