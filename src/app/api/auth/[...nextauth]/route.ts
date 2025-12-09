import NextAuth, { NextAuthOptions } from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"

const scopes = [
    "user-read-email",
    "user-read-private",
    "user-library-read",
    "user-library-modify",
    "playlist-read-private",
    "playlist-read-collaborative"
].join(" ")

import { JWT } from "next-auth/jwt";

// Helper to refresh the access token
async function refreshAccessToken(token: JWT) {
    try {
        if (!token.refreshToken) throw new Error("No refresh token");

        const url = "https://accounts.spotify.com/api/token";
        const basicAuth = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${basicAuth}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: token.refreshToken as string,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw data;
        }

        return {
            ...token,
            accessToken: data.access_token,
            expiresAt: Math.floor(Date.now() / 1000 + data.expires_in),
            refreshToken: data.refresh_token ?? token.refreshToken, // Fallback if Spotify doesn't send a new one
        }
    } catch (error) {
        console.error("Error refreshing Access Token", error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        }
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        SpotifyProvider({
            clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
            authorization: {
                params: { scope: scopes },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            // Initial sign in
            if (account) {
                return {
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    expiresAt: account.expires_at,
                }
            }

            // Return previous token if the access token has not expired yet
            // (expiresAt is in seconds, Date.now() in ms)
            if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
                return token
            }

            // Access token has expired, try to update it
            return refreshAccessToken(token)
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken
            session.error = token.error
            return session
        },
    },
    pages: {
        signIn: '/login',
    },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
