"use client";

import { useState } from "react";
import { Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WaitlistForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

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
        <div className="w-full max-w-sm mx-auto mt-8">
            <AnimatePresence mode="wait">
                {status === "success" ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 text-green-400"
                    >
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{message}</span>
                    </motion.div>
                ) : (
                    <motion.form
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
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
                        <p className="text-[10px] text-zinc-600">
                            We'll simplify your library and help you rediscover your music.
                        </p>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
}
