"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Calendar } from "lucide-react";

interface AgentSaleSummary {
    agentId: string;
    agentName: string;
    totalAmount: number;
}

const showMessage = (message: string, isError: boolean = false) => {
    if (isError) {
        console.error("ALERT (ERROR):", message);
    } else {
        console.log("ALERT:", message);
    }
};

const AGENT_OPTIONS = [
    { id: '00064', name: '00064 - Persoană fizică' },
    { id: '00065', name: '00065 - Plată terminal' },
];

export default function VanzariAgentiReport() {
    // State for selected date and agent filter
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [agentId, setAgentId] = useState("");

    // State for report data and loading status
    const [data, setData] = useState<AgentSaleSummary[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        if (!selectedDate || !agentId) {
            showMessage("Selectați atât data cât și Contragentul.", true);
            return;
        }

        setLoading(true);

        // Prepare query parameters
        const params = new URLSearchParams({
            date: selectedDate,
            agentId: agentId,
        });

        try {
            const res = await fetch(`/api/reports/settlements/contragents/?${params}`);
            const result = await res.json();

            if (res.ok) {
                // The API will return either an array with one item or an empty array
                setData(result.items || []);
            } else {
                showMessage(result.error || "Eroare la generarea raportului", true);
                setData([]);
            }
        } catch(e) {
            showMessage("Eroare de rețea la generarea raportului", true);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // Calculate overall total from the fetched data
    const overallTotal = data.reduce((sum, item) => sum + item.totalAmount, 0);
    const padCode = (code: string | number): string => {
        // Converts the code to a string and pads the start with zeros
        // until the total length is 5 characters (e.g., 64 becomes "00064").
        return String(code).padStart(5, '0');
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                Raport Decontari(Contragent)
            </h1>

            <p className="text-gray-600">
                Afișează suma totală de bani primită de la un anumit contragent (agent) pentru toate realizările confirmate într-o zi selectată.
            </p>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border rounded-lg p-4 bg-gray-50">
                <div>
                    <Label htmlFor="selectedDate" className="mb-2 flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" /> Data
                    </Label>
                    <Input
                        id="selectedDate"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>

                <div>
                    <Label htmlFor="agentSelect">Contragent</Label>
                    <Select value={agentId} onValueChange={setAgentId}>
                        <SelectTrigger id="agentSelect">
                            <SelectValue placeholder="Alege contragentul" />
                        </SelectTrigger>
                        <SelectContent>
                            {AGENT_OPTIONS.map(a => (
                                <SelectItem key={a.id} value={a.id}>
                                    {a.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-end pt-2 md:pt-0">
                    <Button onClick={fetchReport} disabled={loading || !selectedDate || !agentId} className="w-full">
                        {loading ? "Se încarcă..." : "Generează Raport"}
                    </Button>
                </div>
            </div>

            {/* Table */}
            {(data && data.length > 0) ? (
                <div className="border rounded-lg overflow-hidden shadow-lg">
                    <Table>
                        <TableHeader className="bg-emerald-600 hover:bg-emerald-600 text-white">
                            <TableRow>
                                <TableHead className="text-white">Cod Contragent</TableHead>
                                <TableHead className="text-white">Nume Contragent</TableHead>
                                <TableHead className="text-right text-white text-xl">SUMA TOTALĂ ÎNCASATĂ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, i) => (
                                <TableRow key={item.agentId} className="text-lg font-semibold">
                                    <TableCell>{padCode(item.agentId)}</TableCell>
                                    <TableCell>{item.agentName}</TableCell>
                                    <TableCell className="text-right text-emerald-700">
                                        {item.totalAmount.toFixed(2)} MDL
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="font-extrabold bg-gray-100 text-xl border-t-2 border-gray-400">
                                <TableCell colSpan={2}>TOTAL ZI INCASAT (MDL)</TableCell>
                                <TableCell className="text-right text-red-600">
                                    {overallTotal.toFixed(2)} MDL
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="p-8 text-center text-gray-500 border rounded-lg bg-white shadow-md">
                    Selectați data și contragentul și apăsați Generează Raport
                </div>
            )}
        </div>
    );
}
