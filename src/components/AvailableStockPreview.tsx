// components/AvailableStockPreview.tsx
import { useEffect, useState } from "react";

interface Props {
    articleCode: string;
    fromStorageId: string | null;
}

export function AvailableStockPreview({ articleCode, fromStorageId }: Props) {
    const [stock, setStock] = useState<{ storage: string; qty: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!fromStorageId || !articleCode) {
            return;
        }

        fetch(`/api/stock-balance?code=${articleCode}`)
            .then(r => r.json())
            .then(data => {
                setStock(data);
            })
            .catch(() => setLoading(false));
    }, [articleCode, fromStorageId]);


    if (loading) return <div className="text-xs text-gray-500">Se încarcă...</div>;

    const inSource = stock.find(s => s.storage === fromStorageId);
    const others = stock.filter(s => s.storage !== fromStorageId);

    return (
        <div className="mb-1">
            <span className="font-mono">{articleCode}:</span>{' '}
            {inSource ? (
                <span className="text-green-600 font-medium">{inSource.qty} buc în sursă</span>
            ) : (
                <span className="text-red-600">0 buc în sursă</span>
            )}
            {others.length > 0 && (
                <span className="text-xs text-gray-600 ml-2">
          → disponibil în: {others.map(s => `${s.storage} (${s.qty})`).join(', ')}
        </span>
            )}
        </div>
    );
}