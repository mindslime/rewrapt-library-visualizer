"use client";

import { useEffect, useState } from "react";
import { Roboto_Flex } from "next/font/google";

const robotoFlex = Roboto_Flex({
    subsets: ["latin"],
    display: "block",
    // Enable all variable axes
    axes: ["wdth", "GRAD", "slnt", "XTRA", "YOPQ", "YTAS", "YTDE", "YTFI", "YTLC", "YTUC"]
});

interface AnimatedTitleProps {
    text: string;
    className?: string;
}

export default function AnimatedTitle({ text, className = "" }: AnimatedTitleProps) {
    const [isFontLoaded, setIsFontLoaded] = useState(false);

    useEffect(() => {
        // Wait for fonts to be ready to prevent "stutter" on first load
        document.fonts.ready.then(() => {
            setIsFontLoaded(true);
        });
    }, []);

    return (
        <div
            className={`${robotoFlex.className} flex flex-wrap justify-center transition-colors duration-1000 ${isFontLoaded ? 'text-white' : 'text-black'} ${className}`}
        >
            {text.split("").map((char, i) => (
                <span
                    key={i}
                    className="inline-block transform-gpu [backface-visibility:hidden]"
                    style={{
                        animation: `mix-wave 4s ease-in-out infinite`,
                        animationDelay: `${i * 0.15}s`,
                        whiteSpace: char === " " ? "pre" : "normal",
                    }}
                >
                    {char}
                </span>
            ))}
        </div>
    );
}
