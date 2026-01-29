"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { LogOut, User, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function LoginButton({ action, variant = "simple", profileImage }: { action?: "login" | "logout", variant?: "simple" | "flip", profileImage?: string | null }) {
    const { data: session } = useSession();

    // Determine the image source: prop > session > null
    const imageSrc = profileImage || session?.user?.image;

    if (session) {
        if (action === "login") return null;

        return (
            <div className="flex flex-col items-center gap-4">
                {(!action || action === "logout") && (
                    <>
                        {variant === "simple" ? (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => signOut()}
                                    className="bg-zinc-800 hover:bg-red-600 text-zinc-200 hover:text-white p-2 rounded-full shadow-lg transition-all hover:scale-105"
                                    title="Sign out"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="group w-10 h-10 [perspective:1000px]">
                                <div className="relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                                    {/* Front: Profile Pic */}
                                    <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center">
                                        {imageSrc ? (
                                            <img src={imageSrc} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-zinc-400" />
                                        )}
                                    </div>

                                    {/* Back: Logout Button */}
                                    <button
                                        onClick={() => signOut()}
                                        className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg"
                                        title="Sign out"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }

    // Not Signed In
    if (action === "logout") return null;

    return <AnimatedLoginButton />;
}

function AnimatedLoginButton() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    const [waves, setWaves] = useState<number[]>([]);

    const handlePress = () => {
        const id = Date.now();
        setWaves(prev => [...prev, id]);
        setTimeout(() => {
            setWaves(prev => prev.filter(w => w !== id));
        }, 1000);
    };

    return (
        <div className="relative group inline-flex items-center justify-center">
            {/* 1. Underlying Glow (Radial Backlight) - Replacing spinning streak */}
            <div className="absolute -inset-4 opacity-0 group-hover:opacity-75 transition-opacity duration-500 blur-2xl radial-glow bg-green-500/40 rounded-full" />
            <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg bg-green-400/20 rounded-full" />

            {/* Reverb Waves (On Press) */}
            <AnimatePresence>
                {waves.map(id => (
                    <motion.div
                        key={id}
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 2 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full border-2 border-green-400/50 z-0 pointer-events-none"
                    />
                ))}
            </AnimatePresence>

            {/* 2. Audio Particles System */}
            <NoteParticles />

            {/* 3. The Button Itself */}
            <motion.button
                onClick={() => signIn("spotify")}
                onTapStart={handlePress}
                className="relative z-10 bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-8 rounded-full text-lg shadow-xl flex items-center gap-2 overflow-hidden"
                // Desktop Hover
                whileHover={!isMobile ? {
                    scale: 1.05,
                    transition: { duration: 0.2 }
                } : undefined}

                // Tap Interaction (Single Bass Kick / Press)
                whileTap={{
                    scale: 1.15, // Expand on press (Kick)
                    transition: { duration: 0.1, ease: "easeOut" }
                }}
            >
                <span className="relative z-10 flex items-center gap-2">
                    {/* Icon Removed per user request */}
                    Sign in with Spotify
                </span>
            </motion.button>
        </div>
    );
}

// Particle System
function NoteParticles() {
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
            {/* Wrapper needs to be centered. The parent is now inline-flex centered. This div is inset-0.
                 So (0,0) is the center of the button.
             */}
            <AnimatePresence>
                {[...Array(12)].map((_, i) => (
                    <Particle key={i} index={i} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function Particle({ index }: { index: number }) {
    const [config, setConfig] = useState<{ startX: number; startY: number; endX: number; endY: number; duration: number; delay: number; icon: string; scaleEnd: number } | null>(null);

    useEffect(() => {
        // Hydration fix: Only generate random values on client
        // Emulate "Pill" shape emission.
        // Button approx dims: 200px wide, 50px tall.
        // Wider/Taller request: rX=95, rY=35.

        const angle = Math.random() * 360;
        const rad = (angle * Math.PI) / 180;

        // Elliptical starting positions to match button border
        const rX = 95;
        const rY = 35;

        const startX = Math.cos(rad) * rX;
        const startY = Math.sin(rad) * rY;

        // Travel distance (vector)
        // Move outwards by 30-60px
        const travelDist = 30 + Math.random() * 30;
        const endX = Math.cos(rad) * (rX + travelDist);
        const endY = Math.sin(rad) * (rY + travelDist);

        setConfig({
            startX,
            startY,
            endX,
            endY,
            duration: 1.5 + Math.random(), // 1.5 - 2.5s
            delay: Math.random() * 2,
            icon: Math.random() > 0.5 ? "♪" : "♫",
            scaleEnd: 0.6 + Math.random() * 0.4
        });
    }, []);

    if (!config) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: config.startX, y: config.startY, scale: 0.5 }}
            animate={{
                opacity: [0, 1, 0],
                x: [config.startX, config.endX],
                y: [config.startY, config.endY],
                scale: [0.5, config.scaleEnd],
                rotate: [0, Math.random() * 40 - 20]
            }}
            transition={{
                duration: config.duration,
                repeat: Infinity,
                delay: config.delay,
                ease: "easeOut"
            }}
            className="absolute text-green-400/80 font-bold text-lg sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300"
        >
            <div className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 block">
                {config.icon}
            </div>
        </motion.div>
    );
}


