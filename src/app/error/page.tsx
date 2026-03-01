"use client";

import { useSearchParams } from "next/navigation";
import WaitlistForm from "@/components/WaitlistForm";
import AnimatedTitle from "@/components/AnimatedTitle";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    return (
        <div className="flex flex-col bg-black font-[family-name:var(--font-geist-sans)] min-h-screen">
            <main className="flex-1 flex flex-col items-center justify-center p-4 gap-8 text-center sm:p-20">

                <div className="flex flex-col items-center gap-6 max-w-lg w-full">
                    <AnimatedTitle
                        text="Access Denied"
                        className="text-4xl sm:text-6xl text-white font-bold tracking-tighter"
                    />

                    <div className="flex flex-col gap-4 text-zinc-400 text-lg">
                        {(error === "AccessDenied" || error === "OAuthCallback") ? (
                            <>
                                <p>
                                    It looks like your Spotify account hasn't been added to our developer allowlist yet.
                                </p>
                                <p>
                                    While ReWrapt is in development mode, we have a limited number of slots for test users. Join the waitlist below and we'll let you know when space opens up!
                                </p>
                            </>
                        ) : (
                            <p>
                                An unexpected login error occurred. Please try again.
                            </p>
                        )}
                    </div>

                    <div className="w-full max-w-md mt-4">
                        <WaitlistForm defaultShowForm={true} />
                    </div>

                    <div className="mt-8">
                        <Link
                            href="/"
                            className="px-6 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors text-sm font-medium"
                        >
                            Return Home
                        </Link>
                    </div>
                </div>

            </main>
        </div>
    );
}

export default function ErrorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <ErrorContent />
        </Suspense>
    );
}
