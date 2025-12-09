import NextAuth from "next-auth"

declare module "next-auth" {
    interface Session {
        accessToken?: string
        error?: string
        user: {
            name?: string | null
            email?: string | null
            image?: string | null
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string
        expiresAt?: number
        refreshToken?: string
        error?: string
    }
}
