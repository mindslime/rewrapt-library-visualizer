"use client";

import { useEffect, useState } from "react";
import { Roboto_Flex } from "next/font/google";

const robotoFlex = Roboto_Flex({
    subsets: ["latin"],
    display: "block",
    axes: ["wdth", "GRAD", "slnt", "XTRA", "YOPQ", "YTAS", "YTDE", "YTFI", "YTLC", "YTUC"]
});

interface AnimatedTitleProps {
    text: string;
    className?: string;
    variant?: 'hero' | 'navbar';
    animationSpeed?: number; // seconds per cycle
}

export default function AnimatedTitle({
    text,
    className = "",
    variant = 'hero',
    animationSpeed
}: AnimatedTitleProps) {
    const [isVisible, setIsVisible] = useState(false);

    // Default speeds: hero = 5s, navbar = 8s (slower)
    const speed = animationSpeed ?? (variant === 'navbar' ? 8 : 5);

    useEffect(() => {
        // Navbar variant: show immediately (already visible after login)
        if (variant === 'navbar') {
            setIsVisible(true);
            return;
        }

        // Hero variant: check sessionStorage for warmup
        const alreadyShown = sessionStorage.getItem('titleAnimationReady') === 'true';

        if (alreadyShown) {
            setIsVisible(true);
            return;
        }

        const timer = setTimeout(() => {
            setIsVisible(true);
            sessionStorage.setItem('titleAnimationReady', 'true');
        }, 1500);
        return () => clearTimeout(timer);
    }, [variant]);

    // Navbar uses simpler animation name (subtle variant)
    const animationName = variant === 'navbar' ? 'mix-wave-subtle' : 'mix-wave';

    return (
        <div
            className={`${robotoFlex.className} flex flex-wrap justify-center overflow-visible ${variant === 'hero' ? 'p-4' : 'p-0'} ${className}`}
            style={{
                ...(variant === 'hero' ? {
                    maskImage: 'linear-gradient(to right, black 40%, transparent 60%)',
                    WebkitMaskImage: 'linear-gradient(to right, black 40%, transparent 60%)',
                    maskSize: '250% 100%',
                    WebkitMaskSize: '250% 100%',
                    animation: isVisible ? 'title-wipe 5s ease-out forwards' : 'none',
                    maskPosition: isVisible ? undefined : '100% 0',
                    WebkitMaskPosition: isVisible ? undefined : '100% 0',
                } : {}),
                overflow: 'visible',
                minWidth: 'max-content',
            }}
        >
            {text.split("").map((char, i) => (
                <span
                    key={i}
                    className="inline-block transform-gpu [backface-visibility:hidden]"
                    style={{
                        animation: `${animationName} ${speed}s ease-in-out ${i * 0.15}s infinite`,
                        whiteSpace: char === " " ? "pre" : "normal",
                    }}
                >
                    {char}
                </span>
            ))}
        </div>
    );
}
