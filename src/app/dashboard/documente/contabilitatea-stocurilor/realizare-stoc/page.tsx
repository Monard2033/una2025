"use client";

import {useState} from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Printer, FileCheck, Package } from "lucide-react";
import { StockItemsTable, Item } from "@/components/StockItemsTable";
import { Input } from "@/components/ui/input";


export default function RealizareStoc(deps: React.DependencyList) {
    // ---------- state ----------
    const [realizationId, setRealizationId] = useState<number | null>(null);
    const [documentNumber, setDocumentNumber] = useState("");
    const [status, setStatus] = useState<"draft" | "confirmed">("draft");
    const [isEfectuareLoading, setIsEfectuareLoading] = useState(false);
    const [docNumberOrId, setdocNumberOrId] = useState<number | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [agentId, setAgentId] = useState("");
    const [items, setItems] = useState<Item[]>([]);
    const [currentItem, setCurrentItem] = useState({
        articleCode: "",
        nomenclature: "",
        quantity: "1",
        unitPrice: "",
        unitPriceVAT: 0,
        vatPercent: 20,
    });
    const handleInitialSaveAndAddItem = async () => {
        if (!currentItem.nomenclature || !currentItem.unitPrice) {
            alert("Completați nomenclatura și prețul.");
            return;
        }

        try {
            const articleIdToSend = parseInt(currentItem.articleCode.replace(/\D/g, ""), 10) || 0;
            const res = await fetch("/api/realizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agentId: Number(agentId),
                    articleId: articleIdToSend,
                    storageId: 1,
                }),
            });

            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();
            const newRealizationId = data.realizationId;

            if (!newRealizationId) throw new Error("Server did not return a realization ID.");

            setRealizationId(newRealizationId);

            setItems((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    articleCode: currentItem.articleCode,
                    nomenclature: currentItem.nomenclature,
                    quantity: Number(currentItem.quantity) || 1,
                    unitPrice: Number(currentItem.unitPrice) || 0,
                    vatPercent: Number(currentItem.vatPercent) || 20,
                },
            ]);

            // 4. RESET INPUTS
            setCurrentItem({
                articleCode: "",
                nomenclature: "",
                quantity: "1",
                unitPrice: "0",
                unitPriceVAT: 0,
                vatPercent: 20,
            });

        } catch (e:any) {
            alert("Eroare la crearea realizării: " + e.message);
        }
    };

// 💡 MODIFIED addItem function
    const addItem = async () => {
        if (!realizationId) {
            // If realization ID is missing, run the initial save/add process
            await handleInitialSaveAndAddItem();
            return;
        }

        // If ID exists, just add the item locally
        setItems((prev) => [
            ...prev,
            {
                id: Date.now(),
                articleCode: currentItem.articleCode,
                nomenclature: currentItem.nomenclature,
                quantity: Number(currentItem.quantity) || 1,
                unitPrice: Number(currentItem.unitPrice) || 0,
                vatPercent: Number(currentItem.vatPercent) || 20,
            },
        ]);

        // 4. RESET INPUTS
        setCurrentItem({
            articleCode: "",
            nomenclature: "",
            quantity: "1",
            unitPrice: "0",
            unitPriceVAT: 0,
            vatPercent: 20,
        });
    };

    const removeItem = (id: number) => {
        setItems(items.filter((i) => i.id !== id));
    };

    const totals = items.reduce(
        (acc, i) => ({
            amount: acc.amount + i.quantity * i.unitPrice,
            vat:
                acc.vat + i.quantity * i.unitPrice * (i.vatPercent / 100),
        }),
        { amount: 0, vat: 0 }
    );

    const handlePrintInvoice = async () => {
        console.log("Id Realizare si Lungimea elementelor",realizationId,items.length);
        if (!realizationId || items.length === 0) return;
        setIsPrinting(true);
        try {
            // confirm only once
            if (status !== "confirmed") {
                const res = await fetch(`/api/realizations/${realizationId}/print`, {
                    method: "POST",
                });
                if (res.ok) setStatus("confirmed");
            }
            window.open(`/print/invoice/${realizationId}`, "_blank");
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsPrinting(false);
        }
    };
    const handlePrintReceipt = async(realizationId: string | number | null) => {
        // 1. Convert ID to string and validate
        const docId = String(realizationId || '').trim();

        // items.length is assumed to be available in the component scope
        if (!docId || items.length === 0) return;

        console.log("Id Realizare si Lungimea elementelor", docId, items.length);

        // Set loading/printing state
        setIsPrinting(true);

        // Assuming handleEfectuare is the function that saves/confirms the document
        await handleEfectuare();

        try {
            // 2. Perform the server-side confirmation (optional step, based on your logic)
            // Check if the current document status is not "confirmed" before POSTing
            if (status !== "confirmed") {
                const res = await fetch(`/api/realizations/print/${docId}`, {
                    method: "POST",
                });
                if (res.ok) setStatus("confirmed");
            }

            // 3. Open the receipt page
            // Use the validated docId for the URL
            window.open(`/print/receipt/${docId}`, '_blank');

        } catch (e: any) {
            // IMPORTANT: Do not use alert(). I've updated this to use console.error
            // as per the platform rules, but ideally, this would be a UI modal/message box.
            console.error("Eroare la tipărire:", e.message);
        } finally {
            setIsPrinting(false);
        }
    };

    const handleEfectuare = async () => {
        if (!realizationId || items.length === 0) {
            alert("Adăugați cel puțin un articol.");
            return;
        }

        const totals = items.reduce(
            (acc, i) => {
                const line = i.quantity * i.unitPrice;
                const vat = line * (i.vatPercent / 100);
                return {
                    totalAmount: acc.totalAmount + line,
                    totalVAT: acc.totalVAT + vat,
                };
            },
            { totalAmount: 0, totalVAT: 0}
        );

        try {
            const res = await fetch(`/api/realizations/${realizationId}/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items,
                    agentId: Number(agentId),
                    storageId: 1,
                    invoiceNumber: `FV${BigInt(realizationId)}`,
                    documentNumber: `DOC-${String(realizationId).slice(-4)}`,
                    ...totals,
                }),
            });

            if (!res.ok) throw new Error(await res.text());

            setStatus("confirmed");
            alert("Realizarea a fost salvată în baza de date!");
        } catch (e: any) {
            alert("Eroare: " + e.message);
        }
    };

    // ---------- UI ----------
    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 min-w-full">

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                    Realizare Stoc
                    {documentNumber && (
                        <Input>
                            Numar Contract: <strong>{documentNumber}</strong>
                        </Input>
                    )}
                </h2>

            </div>

            {/* Agent selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>Agent</Label>
                    <Select value={agentId} onValueChange={setAgentId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Alege agentul" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">00064 - Persoană fizică</SelectItem>
                            <SelectItem value="2">00065 - Plată terminal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Items table */}
            <div className="border rounded-lg p-4 space-y-4">
                <StockItemsTable
                    items={items}
                    currentItem={currentItem}
                    onCurrentChange={(field, value) =>
                        setCurrentItem((prev) => ({ ...prev, [field]: value }))
                    }
                    onAdd={addItem}
                    onRemove={removeItem}
                />

                <div className="text-right space-y-1 font-medium">
                    <div>Total fără TVA: {(totals.amount - totals.vat).toFixed(2)} MDL</div>
                    <div>TVA: {totals.vat.toFixed(2)} MDL</div>
                    <div className="text-lg">
                        TOTAL: {(totals.amount).toFixed(2)} MDL
                    </div>
                </div>
            </div>

            {/* Buttons – always enabled (draft is auto-created) */}
            <div className="flex gap-3 justify-end mt-6">
                {/* Print Invoice */}
                <Button
                    onClick={()=>handlePrintInvoice}
                    disabled={isPrinting || items.length === 0}
                    className="flex items-center"
                >
                    <Printer className="mr-2 h-4 w-4" />
                    {isPrinting ? "Se generează..." : "Tipărire Factură"}
                </Button>

                {/* Print Cec ) */}
                <Button
                    onClick={() => handlePrintReceipt(realizationId)}
                    variant="secondary"
                    disabled={items.length === 0}
                    className="flex items-center"
                >
                    <FileCheck className="mr-2 h-4 w-4" />
                    Tiparire Cec
                </Button>

                {/* Efectuare */}
                <Button
                    onClick={handleEfectuare}
                    disabled={!realizationId || items.length === 0 || status === "confirmed"}
                    className={`
                flex items-center text-white
                ${status === "confirmed"
                                    ? "bg-green-700 hover:bg-green-800"
                                    : "bg-emerald-600 hover:bg-emerald-700"
                                }
              `}
                >
                    <Package className="mr-2 h-4 w-4" />
                    {status === "confirmed" ? "Efectuată" : "Efectuare"}
                </Button>
            </div>
        </div>
    );
}