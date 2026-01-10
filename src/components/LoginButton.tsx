"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";

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

    return (
        <button
            onClick={() => signIn("spotify")}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-green-900/20 shadow-xl transition-all hover:scale-105"
        >
            Sign in with Spotify
        </button>
    );
}
