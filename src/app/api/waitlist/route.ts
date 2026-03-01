import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email || typeof email !== "string" || !email.includes("@")) {
            return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
        }

        const waitlistPath = path.join(process.cwd(), "waitlist.json");
        let currentList = [];

        try {
            if (fs.existsSync(waitlistPath)) {
                const fileContent = fs.readFileSync(waitlistPath, "utf-8");
                currentList = JSON.parse(fileContent);
            }
        } catch (readError) {
            console.error("Error reading waitlist file:", readError);
            // Continue with empty list if file is corrupt or unreadable
        }

        // Check for duplicates
        if (currentList.some((entry: any) => entry.email === email)) {
            return NextResponse.json({ message: "Already on the list!" }, { status: 200 });
        }

        const newEntry = {
            email,
            timestamp: new Date().toISOString(),
            userAgent: req.headers.get("user-agent") || "unknown",
        };

        currentList.push(newEntry);

        try {
            fs.writeFileSync(waitlistPath, JSON.stringify(currentList, null, 2), "utf-8");
        } catch (writeError) {
            console.warn("Could not write to waitlist.json (normal in serverless read-only deployment):", writeError);
        }

        // Placeholder for Email Notification service
        try {
            if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL && process.env.SPOTIFY_CLIENT_ID) {
                const resend = new Resend(process.env.RESEND_API_KEY);
                await resend.emails.send({
                    from: "ReWrapt Waitlist <onboarding@resend.dev>",
                    to: process.env.NOTIFICATION_EMAIL,
                    subject: "New Waitlist Signup!",
                    html: `<p>A new user joined the waitlist: <strong>${email}</strong></p>
                           <p><a href="https://developer.spotify.com/dashboard/${process.env.SPOTIFY_CLIENT_ID}/users">Click here to access ReWrapt dashboard</a></p>`
                });
            } else {
                console.warn("Resend API key, Notification Email, or Spotify Client ID not set. Skipping email notification.");
            }
        } catch (emailError) {
            console.error("Waitlist email notification failed:", emailError);
            // Do not block the successful waitlist signup response
        }
        return NextResponse.json({ message: "Successfully added to waitlist" }, { status: 200 });

    } catch (error) {
        console.error("Waitlist API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
