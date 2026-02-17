import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

        fs.writeFileSync(waitlistPath, JSON.stringify(currentList, null, 2), "utf-8");

        // Placeholder for Email Notification service
        // await sendNotificationEmail(email);

        return NextResponse.json({ message: "Successfully added to waitlist" }, { status: 200 });

    } catch (error) {
        console.error("Waitlist API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
