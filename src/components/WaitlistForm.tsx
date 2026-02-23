"use client";

import { useState } from "react";
import { Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WaitlistForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [showForm, setShowForm] = useState(false);
    const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes("@")) {
            setStatus("error");
            setMessage("Please enter a valid email address.");
            return;
        }

        setStatus("loading");
        setMessage("");

        try {
            const res = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setStatus("success");
                setMessage("You're on the list! We'll be in touch.");
                setEmail("");
            } else {
                const data = await res.json();
                setStatus("error");
                setMessage(data.error || "Something went wrong. Please try again.");
            }
        } catch (error) {
            setStatus("error");
            setMessage("Failed to join waitlist. Please check your connection.");
        }
    };

    return (
        <>
            {/* Trigger button pinned to bottom of viewport */}
            <AnimatePresence>
                {!showForm && status !== "success" && (
                    <motion.button
                        key="trigger"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setShowForm(true)}
                        className="fixed bottom-6 left-0 right-0 mx-auto w-fit text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer z-50"
                    >
                        Unable to login with Spotify? {isTouchDevice ? "Tap" : "Click"} here.
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Waitlist form revealed on click */}
            <AnimatePresence mode="wait">
                {showForm && status !== "success" && (
                    <motion.div
                        key="form-wrapper"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full max-w-sm mx-auto mt-8"
                    >
                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-3"
                        >
                            <div className="relative group">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email to join waitlist"
                                    disabled={status === "loading"}
                                    className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-green-500/50 rounded-lg px-4 py-3 outline-none text-white placeholder-zinc-500 transition-all focus:bg-zinc-900 disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={status === "loading" || !email}
                                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-zinc-800 hover:bg-zinc-700 text-white px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {status === "loading" ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ArrowRight className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            {status === "error" && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-red-400 text-xs text-left px-1"
                                >
                                    {message}
                                </motion.p>
                            )}
                        </form>
                    </motion.div>
                )}

                {status === "success" && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-full max-w-sm mx-auto mt-8 bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 text-green-400"
                    >
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
