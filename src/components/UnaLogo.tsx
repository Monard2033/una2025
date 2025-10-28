// src/components/UnaLogo.tsx
import Image from 'next/image';

export const UnaLogo = () => {
    return (
        <Image
            src="/UnaLogo.png"
            alt="UNA Logo"
            width={42}
            height={42}
            className="object-contain"
            priority // Optional: load immediately
        />
    );
};