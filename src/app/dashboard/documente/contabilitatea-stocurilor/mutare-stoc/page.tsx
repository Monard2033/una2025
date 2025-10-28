"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Package } from "lucide-react";
import {Item, StockItemsTable} from "@/components/StockItemsTable";
import {AvailableStockPreview} from "@/components/AvailableStockPreview";


interface Storage {
    id: string; // Stored as string to match Select component values
    name: string;
}

export default function MutareStoc() {
    const [fromWarehouse, setFromWarehouse] = useState("");
    const [toWarehouse, setToWarehouse] = useState("");
    const [storages, setStorages] = useState<Storage[]>([]);
    const [loadingStorages, setLoadingStorages] = useState(true);
    const [items, setItems] = useState<Item[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [currentItem, setCurrentItem] = useState({
        articleCode: "",
        nomenclature: "",
        quantity: "",
        unitPrice: "",
        unitPriceVAT: 0,
        vatPercent: 20,
    });

    // 💡 Fetch storages on component mount
    useEffect(() => {
        const fetchStorages = async () => {
            try {
                const res = await fetch('/api/storages');
                if (!res.ok) {
                    throw new Error("Failed to fetch storages");
                }
                const data = await res.json();
                setStorages(data);
            } catch (error) {
                console.error("Error loading storages:", error);
                // Optionally show a message to the user here
            } finally {
                setLoadingStorages(false);
            }
        };
        fetchStorages();
    }, []);

    const handleCurrentChange = (field: string, value: string | number) => {
        setCurrentItem((prev) => ({ ...prev, [field]: value }));
    };

    const addItem = () => {
        if (!currentItem.nomenclature || !currentItem.unitPrice) return;

        const qty = parseFloat(currentItem.quantity) || 0;
        const price = parseFloat(currentItem.unitPrice) || 0;


        setItems([
            ...items,
            {
                id: Date.now(),
                articleCode: currentItem.articleCode,
                nomenclature: currentItem.nomenclature,
                quantity: qty,
                unitPrice: price,
                vatPercent: currentItem.vatPercent,
            },
        ]);

        setCurrentItem({
            articleCode: "",
            nomenclature: "",
            quantity: "",
            unitPrice: "",
            unitPriceVAT: 0,
            vatPercent: 20,
        });
    };

    const removeItem = (id: number) => {
        setItems(items.filter((i) => i.id !== id));
    };

    const handleCarryOut = async () => {
        setMessage(null);
        if (!fromWarehouse || !toWarehouse || items.length === 0) {
            setMessage({type: 'error', text: "Completează depozitele și adaugă cel puțin un articol."});
            return;
        }
        if (fromWarehouse === toWarehouse) {
            setMessage({type: 'error', text: "Depozitul sursă nu poate fi identic cu cel destinație."});
            return;
        }

        setIsProcessing(true);

        try {
            const transferItems = items.map(i => ({
                articleCode: i.articleCode,
                quantity: i.quantity,
            }));


            const res = await fetch('/api/transfers', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ from: fromWarehouse, to: toWarehouse, items: transferItems})
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.error);
                setMessage({type: 'error', text: data.error});
                return;
            }
            // SUCCESS MESSAGE
            const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
            const fromName = storages.find(s => s.id === fromWarehouse)?.name || "Depozit";
            const toName = storages.find(s => s.id === toWarehouse)?.name || "Depozit";


            alert(`Mutare stoc efectuată cu succes!\n${totalItems} buc mutat din ${fromName} → ${toName}`);
            setItems([]);
            setFromWarehouse("");
            setToWarehouse("");

        } catch (error: any) {
            console.error('%c[FRONTEND ERROR]', 'color: #FF5722;', error);
            setMessage({type: 'error', text: 'Eroare de rețea.'});
        } finally {
            setIsProcessing(false);
        }
    };
    const isSelectDisabled = loadingStorages || storages.length === 0;

    const renderStorageOptions = (excludeId?: string) => (
        storages
            .filter(s => s.id !== excludeId)
            .map(s => (
                <SelectItem key={s.id} value={s.id}>
                    {s.name}
                </SelectItem>
            ))
    );

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 min-w-full">
            <h1 className="text-2xl font-bold">Mutare Stoc</h1>
            <div className="mt-4 p-3 bg-gray-50 rounded border text-sm">
                <p className="font-semibold mb-2">Stoc disponibil pentru transfer:</p>
                {items.map((item, idx) => (
                    <AvailableStockPreview
                        key={idx}
                        articleCode={item.articleCode}
                        fromStorageId={fromWarehouse}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>Din depozit</Label>
                    <div className="relative">
                        <Select value={fromWarehouse} onValueChange={setFromWarehouse} disabled={isSelectDisabled}>
                            <SelectTrigger className="pr-10">
                                <SelectValue
                                    placeholder={loadingStorages ? "Se încarcă depozitele..." : "Alege depozitul sursă"}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {renderStorageOptions(toWarehouse)}
                            </SelectContent>
                        </Select>

                        {/* CLEAR BUTTON */}
                        {fromWarehouse && (
                            <button
                                type="button"
                                onClick={() => setFromWarehouse("")}
                                className="absolute right-10 font-bold top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-600 transition"
                                title="Deselectează"
                            >
                             X
                            </button>
                        )}
                    </div>
                </div>

                <div>
                    <Label>In depozit</Label>
                    <div className="relative">
                        <Select value={toWarehouse} onValueChange={setToWarehouse} disabled={isSelectDisabled}>
                            <SelectTrigger className="pr-10">
                                <SelectValue
                                    placeholder={loadingStorages ? "Se încarcă depozitele..." : "Alege depozitul destinație"}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {renderStorageOptions(fromWarehouse)}
                            </SelectContent>
                        </Select>

                        {/* CLEAR BUTTON */}
                        {toWarehouse && (
                            <button
                                type="button"
                                onClick={() => setToWarehouse("")}
                                className="absolute font-bold right-10 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-600 transition"
                                title="Deselectează"
                            >
                               X
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Reusable Table */}
            <StockItemsTable
                items={items}
                currentItem={currentItem}
                onCurrentChange={handleCurrentChange}
                onAdd={addItem}
                onRemove={removeItem}
            />

            {/* Totals */}
            <div className="text-right space-y-1 font-medium">
                <div>Total articole: {items.reduce((s, i) => s + i.quantity, 0)}</div>
                <div>Valoare totală: {items.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toFixed(2)} MDL</div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
                <Button onClick={handleCarryOut}>
                    <Package className="mr-2 h-4 w-4" /> Efectuare
                </Button>
            </div>
        </div>
    );
}
