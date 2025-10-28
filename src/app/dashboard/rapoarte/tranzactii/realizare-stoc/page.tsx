// src/app/dashboard/rapoarte/tranzactii/realizare-stoc/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "lucide-react";

interface SaleItem {
    date: string;
    nomenclature: string;
    storage: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface Totals {
    quantity: number;
    amount: number;
}

interface Storage {
    id: string;
    name: string;
}

export default function RealizareStocReport() {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [articleId, setArticleId] = useState("");
    const [storageId, setStorageId] = useState("");
    const [storages, setStorages] = useState<Storage[]>([]);
    const [data, setData] = useState<SaleItem[]>([]);
    const [totals, setTotals] = useState<Totals>({ quantity: 0, amount: 0 });
    const [loading, setLoading] = useState(false);

    // Load storages on mount
    useEffect(() => {
        fetch('/api/storages')
            .then(r => r.json())
            .then(d => setStorages(d));
    }, []);

    const fetchReport = async () => {
        if (!fromDate || !toDate) {
            alert("Selectați perioada!");
            return;
        }

        setLoading(true);
        const params = new URLSearchParams({
            from: fromDate,
            to: toDate,
            ...(articleId && { articleId }),
            ...(storageId && { storage: storageId }),
        });

        const res = await fetch(`/api/reports/stock-realizations?${params}`);
        const result = await res.json();

        if (res.ok) {
            setData(result.items);
            setTotals(result.totals);
        } else {
            alert(result.error || "Eroare");
        }
        setLoading(false);
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Raport Realizări Stoc
            </h1>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border rounded-lg p-4 bg-gray-50">
                <div>
                    <Label>De la</Label>
                    <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>

                <div>
                    <Label>Până la</Label>
                    <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>

                <div>
                    <Label>Cod Articul</Label>
                    <Input
                        placeholder="Optional"
                        value={articleId}
                        onChange={(e) => setArticleId(e.target.value)}
                    />
                </div>

                <div>
                    <Label>Depozit</Label>
                    <Select value={storageId} onValueChange={setStorageId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Toate" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toate depozitele</SelectItem>
                            {storages.map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={fetchReport} disabled={loading}>
                    {loading ? "Se încarcă..." : "Generează Raport"}
                </Button>
            </div>

            {/* Table */}
            {data.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Depozit</TableHead>
                                <TableHead>Nomenclatură</TableHead>
                                <TableHead className="text-right">Cant.</TableHead>
                                <TableHead className="text-right">Preț</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, i) => (
                                <TableRow key={i}>
                                    <TableCell>{new Date(item.date).toLocaleDateString("ro-MD")}</TableCell>
                                    <TableCell>{item.storage}</TableCell>
                                    <TableCell>{item.nomenclature}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{item.unitPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{item.total.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="font-bold bg-gray-100">
                                <TableCell colSpan={3}>TOTAL</TableCell>
                                <TableCell className="text-right">{totals.quantity}</TableCell>
                                <TableCell className="text-right">—</TableCell>
                                <TableCell className="text-right">{totals.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}