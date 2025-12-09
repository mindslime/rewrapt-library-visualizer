"use client";

import { useEffect, useState } from "react";
import { SongNode } from "@/types";
import GenreMap from "./vis/GenreMap";
import TimelineMap from "./vis/TimelineMap";

export default function Dashboard() {
    const [nodes, setNodes] = useState<SongNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/data");
                if (!res.ok) throw new Error("Failed to fetch data");
                const data = await res.json();
                setNodes(data.nodes);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const [view, setView] = useState<"genre" | "release" | "added">("genre");

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-white">
                <div className="animate-pulse">Loading your music library... (This may take a minute)</div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500">Error: {error}</div>;
    }

    return (
        <div className="w-full h-screen bg-black flex flex-col">
            <header className="p-4 border-b border-gray-800 flex justify-between items-center z-10 bg-black/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-blue-500">
                        Music Map
                    </h1>
                    <nav className="flex gap-2 bg-zinc-800/50 p-1 rounded-lg">
                        {(["genre", "release", "added"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-3 py-1 rounded-md text-sm transition-all ${view === v
                                        ? "bg-zinc-700 text-white shadow-sm"
                                        : "text-zinc-400 hover:text-white"
                                    }`}
                            >
                                {v === "genre" && "Genre Cluster"}
                                {v === "release" && "Music Timeline"}
                                {v === "added" && "Taste Journey"}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="text-xs text-gray-500">{nodes.length} songs analyzed</div>
            </header>

            <div className="flex-1 overflow-hidden relative">
                {view === "genre" && <GenreMap data={nodes} />}
                {view !== "genre" && <TimelineMap data={nodes} mode={view} />}
            </div>
        </div>
    );
}
