// src/components/NumberInput.tsx
import { Input } from "@/components/ui/input";

interface NumberInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    min?: number;
}

export function NumberInput({ value, onChange, placeholder, min = 0 }: NumberInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowed = [46, 8, 9, 27, 13, 110, 190]; // backspace, delete, tab, escape, enter, dot
        if (allowed.includes(e.keyCode) || (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode))) return;
        if ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    };

    const handleBlur = () => {
        const num = parseFloat(value);
        if (isNaN(num) || num < min) {
            onChange(min.toString());
        } else {
            onChange(num.toString());
        }
    };

    return (
        <Input
            type="text"
            inputMode="decimal"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
        />
    );
}