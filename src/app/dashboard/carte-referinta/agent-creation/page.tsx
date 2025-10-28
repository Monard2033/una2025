// src/app/dashboard/carte-referinta/agent-creation/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/NumberInput";
import { Save, UserPlus } from "lucide-react";

interface AgentAccount {
    bankName: string;
    iban: string;
    isActive: boolean;
}

export default function AgentCreation() {
    const [agentCode, setAgentCode] = useState("");
    const [isResident, setIsResident] = useState(true);
    const [isIndividual, setIsIndividual] = useState(true);
    const [name, setName] = useState("");
    const [fullName, setFullName] = useState("");
    const [legalAddress, setLegalAddress] = useState("");
    const [postalAddress, setPostalAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [fiscalCode, setFiscalCode] = useState("");
    const [city, setCity] = useState("");
    const [regNumber, setRegNumber] = useState("");
    const [country, setCountry] = useState("MD");
    const [district, setDistrict] = useState("");
    const [creditDays, setCreditDays] = useState("0");
    const [discount, setDiscount] = useState("0.00");
    const [promoConsent, setPromoConsent] = useState(false);
    const [blockLoading, setBlockLoading] = useState(false);
    const [useIndividualDiscount, setUseIndividualDiscount] = useState(false);
    const [blockDebt, setBlockDebt] = useState(false);
    const [isCreditor, setIsCreditor] = useState(false);
    const [onRealization, setOnRealization] = useState(false);

    const [accounts, setAccounts] = useState<AgentAccount[]>([]);
    const [currentAccount, setCurrentAccount] = useState({
        bankName: "",
        iban: "",
        isActive: true,
    });

    const addAccount = () => {
        if (!currentAccount.bankName || !currentAccount.iban) return;
        setAccounts([...accounts, { ...currentAccount }]);
        setCurrentAccount({ bankName: "", iban: "", isActive: true });
    };

    const removeAccount = (index: number) => {
        setAccounts(accounts.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!agentCode || !name) {
            alert("Cod si Denumire sunt obligatorii!");
            return;
        }

        const payload = {
            agentCode,
            idNumber: fiscalCode,
            name,
            email: "",
            phone,
            address: legalAddress,
            isIndividual,
            accounts: accounts.map(a => ({
                bankName: a.bankName,
                iban: a.iban,
                isActive: a.isActive,
            })),
            // Optional fields
            fullName,
            postalAddress,
            city,
            regNumber,
            country,
            district,
            creditDays: parseInt(creditDays) || 0,
            discount: parseFloat(discount) || 0,
            promoConsent,
            blockLoading,
            useIndividualDiscount,
            blockDebt,
            isCreditor,
            onRealization,
        };

        const res = await fetch("/api/agents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            alert("Agent înregistrat cu succes!");
            // Reset form
            setAgentCode("");
            setName("");
            setAccounts([]);
        } else {
            const err = await res.json();
            alert("Eroare: " + err.error);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <UserPlus className="h-6 w-6" />
                Înregistrare Agent
            </h1>

            {/* Header */}
            <div className="flex items-center gap-4">
                <Label className="w-32">Cod:</Label>
                <Input
                    value={agentCode}
                    onChange={(e) => setAgentCode(e.target.value)}
                    className="w-36 "
                    placeholder="2005"
                />
                <Label className="w-32">Rezident:</Label>
                <Select value={isResident ? "1" : "0"} onValueChange={(v) => setIsResident(v === "1")}>
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Rezident</SelectItem>
                        <SelectItem value="0">Nerezident</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Main Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Label className="w-32">Contragent:</Label>
                        <Select value={isIndividual ? "pf" : "pj"} onValueChange={(v) => setIsIndividual(v === "pf")}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pf">Persoană fizică</SelectItem>
                                <SelectItem value="pj">Persoană juridică</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-3">
                        <Label className="w-32">Denumire:</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
                    </div>

                    <div className="flex items-center gap-3">
                        <Label className="w-32">Denumire completă:</Label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="flex-1" />
                    </div>

                    <div className="flex items-center gap-3">
                        <Label className="w-32">Adresă juridică:</Label>
                        <Input value={legalAddress} onChange={(e) => setLegalAddress(e.target.value)} className="flex-1" />
                    </div>

                    <div className="flex items-center gap-3">
                        <Label className="w-32">Adresă poștală:</Label>
                        <Input value={postalAddress} onChange={(e) => setPostalAddress(e.target.value)} className="flex-1" />
                    </div>

                    <div className="flex items-center gap-3">
                        <Label className="w-32">Telefon:</Label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1" />
                    </div>

                    <div className="flex items-center gap-3">
                        <Label className="w-32">Cod fiscal:</Label>
                        <Input value={fiscalCode} onChange={(e) => setFiscalCode(e.target.value)} className="flex-1" />
                    </div>

                    <div className="flex items-center gap-3">
                        <Label className="w-32">Oraș:</Label>
                        <Input value={city} onChange={(e) => setCity(e.target.value)} className="flex-1" />
                    </div>

                    <div className="flex items-center gap-3">
                        <Label className="w-32">Nr. înregistrare:</Label>
                        <Input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} className="flex-1" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Label className="w-32">Țară:</Label>
                        <Input value={country} onChange={(e) => setCountry(e.target.value)} className="w-32" />
                    </div>

                    <div className="flex items-center gap-3">
                        <Label className="w-32">Raion:</Label>
                        <Input value={district} onChange={(e) => setDistrict(e.target.value)} className="flex-1" />
                    </div>

                    <div className="flex items-center gap-3">
                        <Label className="w-32">Termen credit:</Label>
                        <NumberInput
                            value={creditDays}
                            onChange={setCreditDays}
                            placeholder="0"
                            min={0}
                        />
                        <span className="text-sm text-muted-foreground">zile</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Label className="w-32">Reducere individuală:</Label>
                        <NumberInput
                            value={discount}
                            onChange={setDiscount}
                            placeholder="0.00"
                            min={0}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                    </div>
                </div>
            </div>

            {/* Bank Accounts */}
            <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Conturi bancare</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Input
                        placeholder="Denumire bancă"
                        value={currentAccount.bankName}
                        onChange={(e) => setCurrentAccount({ ...currentAccount, bankName: e.target.value })}
                    />
                    <Input
                        placeholder="IBAN"
                        value={currentAccount.iban}
                        onChange={(e) => setCurrentAccount({ ...currentAccount, iban: e.target.value })}
                    />
                    <Button onClick={addAccount} size="sm">
                        Adauga
                    </Button>
                </div>

                {accounts.length > 0 && (
                    <div className="space-y-2">
                        {accounts.map((acc, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                <span className="flex-1">
                  {acc.bankName} – {acc.iban}
                </span>
                        <Button size="sm" variant="ghost" onClick={() => removeAccount(i)}>
                            Remove
                        </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} size="lg">
                    <Save className="mr-2 h-5 w-5" />
                    Salvează Agentul
                </Button>
            </div>
        </div>
    );
}