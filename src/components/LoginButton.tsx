"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function LoginButton() {
    const { data: session } = useSession();

    if (session) {
        return (
            <div className="flex flex-col items-center gap-4">
                <p className="text-white">Signed in as {session.user?.email}</p>
                <button
                    onClick={() => signOut()}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                >
                    Sign out
                </button>
            </div>
        );
    }
    return (
        <button
            onClick={() => signIn("spotify")}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
            Sign in with Spotify
        </button>
    );
}
