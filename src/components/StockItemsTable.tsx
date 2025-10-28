// src/components/StockItemsTable.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { NumberInput } from "@/components/NumberInput";

export interface Item {
    id: number;
    articleCode: string;
    nomenclature: string;
    quantity: number;
    unitPrice: number;
    vatPercent: number;
}

export interface StockItemsTableProps {
    items: Item[];
    currentItem: {
        articleCode: string;
        nomenclature: string;
        quantity: string;
        unitPrice: string;
        unitPriceVAT: number;
        vatPercent: number;
    };
    onCurrentChange: (field: string, value: string | number) => void;
    onAdd: () => void;
    onRemove: (id: number) => void;
}

export function StockItemsTable({
                                    items,
                                    currentItem,
                                    onCurrentChange,
                                    onAdd,
                                    onRemove,
                                }: StockItemsTableProps) {
    const [loading, setLoading] = useState(false);
    // Auto-fill when articleCode changes
    useEffect(() => {
        const code = currentItem.articleCode.trim();
        if (!code) {
            onCurrentChange("nomenclature", "");
            onCurrentChange("unitPrice", "");
            onCurrentChange("vatPercent", 20);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/articles/search?code=${encodeURIComponent(code)}`);
                if (res.ok) {
                    const data = await res.json();
                    onCurrentChange("nomenclature", data.nomenclature || "");
                    onCurrentChange("unitPrice", data.defaultPrice?.toString() || "");
                    onCurrentChange("vatPercent", Number(data.vatPercent) || 20);
                } else {
                    onCurrentChange("nomenclature", "");
                    onCurrentChange("unitPrice", "");
                }
            } catch (err) {
                console.error("Auto-fill failed:", err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [currentItem.articleCode]); // ← ONLY articleCode


    return (
        <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Articol nou</h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {/* Cod Articol */}
                <Input
                    placeholder="Cod articol(de ex.41200/50700)"
                    value={currentItem.articleCode}
                    onChange={(e) => onCurrentChange("articleCode", e.target.value)}
                />

                {/* Nomenclatură */}
                <div className="relative">
                    <Input
                        placeholder="Nomenclatură"
                        value={currentItem.nomenclature}
                        onChange={(e) => onCurrentChange("nomenclature", e.target.value)}
                        disabled={loading}
                        className={loading ? "opacity-50" : ""}
                    />
                    {loading && (
                        <div className="absolute right-2 top-2 text-xs text-muted-foreground">
                            Se Caută...
                        </div>
                    )}
                </div>

                {/* Cantitate */}
                <NumberInput
                    placeholder="Cantitate"
                    value={currentItem.quantity}
                    onChange={(v) => onCurrentChange("quantity", v)}
                    min={1}
                />

                {/* Preț unitar */}
                <NumberInput
                    placeholder="Preț unitar"
                    value={currentItem.unitPrice}
                    onChange={(v) => onCurrentChange("unitPrice", v)}
                    min={0}
                />

                {/* Add Button */}
                <Button onClick={onAdd} size="sm" disabled={loading}>
                    Adaugă
                </Button>
            </div>

            {/* Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cod</TableHead>
                        <TableHead>Nomenclatură</TableHead>
                        <TableHead>Cant.</TableHead>
                        <TableHead>Preț</TableHead>
                        <TableHead>TVA %</TableHead>
                        <TableHead>Total fara TVA</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => {
                        const lineAmount   = item.quantity * item.unitPrice;
                        const lineVat      = lineAmount * (item.vatPercent / 100);
                        return (
                            <TableRow key={item.id}>
                                <TableCell>{item.articleCode}</TableCell>
                                <TableCell>{item.nomenclature}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.unitPrice}</TableCell>
                                <TableCell>{item.vatPercent}%</TableCell>
                                <TableCell className="text-right">
                                    {(lineAmount-lineVat).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {lineAmount.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <Button size="sm" variant="ghost" onClick={() => onRemove(item.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}

                    {/*{items.length > 0 && (*/}
                    {/*    <TableRow className="font-bold bg-gray-50">*/}
                    {/*        <TableCell colSpan={5} className="text-right">*/}
                    {/*            TOTAL*/}
                    {/*        </TableCell>*/}

                    {/*        <TableCell className="text-right">*/}
                    {/*            {items*/}
                    {/*                .reduce((s, i) => s + i.quantity * i.unitPrice, 0)*/}
                    {/*                .toFixed(2)}*/}
                    {/*        </TableCell>*/}
                    {/*        <TableCell />*/}
                    {/*    </TableRow>*/}
                    {/*)}*/}
                </TableBody>
            </Table>
        </div>
    );
}