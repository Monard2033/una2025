"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Loader2, Warehouse } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// --- Type Definitions (Must be defined locally for copy-paste) ---

interface Storage {
    id: string;
    name: string;
}

interface TransferItem {
    articleCode: string;
    nomenclature: string;
    quantity: number;
}

interface TransferDocument {
    docId: string;
    documentDate: string; // ISO date string
    fromStorageId: string;
    toStorageId: string;
    items: TransferItem[];
}

// --- Report Component ---

export default function StockMovementReport() {
    const [selectedStorageId, setSelectedStorageId] = useState("");
    const [storages, setStorages] = useState<Storage[]>([]);
    const [loadingStorages, setLoadingStorages] = useState(true);
    const [documents, setDocuments] = useState<TransferDocument[]>([]);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<TransferDocument | null>(null);

    // Helper to find storage name by ID
    const getStorageName = (id: string) => storages.find(s => s.id === id)?.name || id;

    // 💡 Fetch storages on component mount
    useEffect(() => {
        const fetchStorages = async () => {
            try {
                const res = await fetch('/api/storages');
                if (!res.ok) throw new Error("Failed to fetch storages");
                const data = await res.json();
                setStorages(data);
            } catch (error) {
                console.error("Error loading storages:", error);
            } finally {
                setLoadingStorages(false);
            }
        };
        fetchStorages();
    }, []);

    // 💡 Fetch documents when selectedStorageId changes
    useEffect(() => {
        const fetchDocuments = async () => {
            if (!selectedStorageId) {
                setDocuments([]);
                return;
            }
            setLoadingDocuments(true);
            try {
                // Fetch all transfers related to the selected storage (either as source or destination)
                const res = await fetch(`/api/reports/stock-transfers?storageId=${selectedStorageId}`);
                if (!res.ok) throw new Error("Failed to fetch documents");
                const data = await res.json();
                setDocuments(data);
            } catch (error) {
                console.error("Error loading documents:", error);
                setDocuments([]);
            } finally {
                setLoadingDocuments(false);
            }
        };
        fetchDocuments();
    }, [selectedStorageId]);


    const isSelectDisabled = loadingStorages || storages.length === 0;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 min-w-full">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Warehouse className="w-7 h-7 text-primary" />
                    Raport Mișcări Stoc (Transferuri)
                </h1>
            </header>
            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>Filtru Depozit</CardTitle>
                    <CardDescription>Selectează depozitul pentru a vizualiza toate tranzacțiile de mutare stoc aferente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-w-md">
                        <Label htmlFor="storage-select">Alege Depozitul</Label>
                        <Select value={selectedStorageId} onValueChange={setSelectedStorageId} disabled={isSelectDisabled}>
                            <SelectTrigger id="storage-select">
                                <SelectValue placeholder={loadingStorages ? "Se încarcă depozitele..." : "Selectează un depozit"} />
                            </SelectTrigger>
                            <SelectContent>
                                {storages.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Documente de Mutare Stoc</CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingDocuments && (
                        <div className="flex justify-center items-center p-8">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            Se încarcă tranzacțiile...
                        </div>
                    )}

                    {!loadingDocuments && documents.length === 0 && selectedStorageId && (
                        <div className="p-8 text-center text-muted-foreground">
                            Nu au fost găsite documente de mutare stoc pentru depozitul selectat.
                        </div>
                    )}

                    {!loadingDocuments && documents.length > 0 && (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nr. Document</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Din Depozit</TableHead>
                                        <TableHead>În Depozit</TableHead>
                                        <TableHead className="text-right">Acțiuni</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.map((doc) => (
                                        <TableRow key={doc.docId}>
                                            <TableCell className="font-medium">{doc.docId}</TableCell>
                                            <TableCell>{new Date(doc.documentDate).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <span className={doc.fromStorageId === selectedStorageId ? "font-semibold text-red-600" : ""}>
                                                    {getStorageName(doc.fromStorageId)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={doc.toStorageId === selectedStorageId ? "font-semibold text-green-600" : ""}>
                                                    {getStorageName(doc.toStorageId)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => setSelectedDocument(doc)}>
                                                    <Eye className="w-4 h-4 mr-2" /> Vezi Conținut
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Document Details Modal */}
            <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
                <DialogContent className="sm:max-w-[750px]">
                    {selectedDocument && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Conținut Document #{selectedDocument.docId}</DialogTitle>
                                <DialogDescription>
                                    Transfer din **{getStorageName(selectedDocument.fromStorageId)}** către **{getStorageName(selectedDocument.toStorageId)}** pe data de {new Date(selectedDocument.documentDate).toLocaleDateString()}.
                                </DialogDescription>
                            </DialogHeader>
                            <Separator />
                            <div className="h-[40vh] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cod Articol</TableHead>
                                            <TableHead>Denumire</TableHead>
                                            <TableHead className="text-right">Cantitate</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedDocument.items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.articleCode}</TableCell>
                                                <TableCell>{item.nomenclature}</TableCell>
                                                <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}