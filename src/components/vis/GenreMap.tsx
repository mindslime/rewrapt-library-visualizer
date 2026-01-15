"use client";

import { useState, useCallback, useEffect } from "react";
import { GenreNode, SpotifyTrack } from "@/types/spotify";
import MusicCanvas from "./MusicCanvas";
import { ArrowLeft, X } from "lucide-react";

interface GenreMapProps {
    data: GenreNode[];
    contextType?: 'library' | 'playlist';
}

export default function GenreMap({ data, contextType = 'library' }: GenreMapProps) {
    const [viewMode, setViewMode] = useState<'GLOBAL' | 'CLUSTER'>('GLOBAL');
    const [activeData, setActiveData] = useState<GenreNode[]>(data);
    const [selectedGenre, setSelectedGenre] = useState<GenreNode | null>(null);
    const [selectedArtist, setSelectedArtist] = useState<GenreNode | null>(null); // For Modal

    // Sync with prop updates (e.g. data load)
    useEffect(() => {
        if (viewMode === 'GLOBAL' && !selectedGenre) {
            setActiveData(data);
        }
    }, [data, viewMode, selectedGenre]);

    const handleNodeClick = useCallback((node: GenreNode) => {
        if (viewMode === 'GLOBAL') {
            // Drill down to Genre -> Artists
            if (node.children && node.children.length > 0) {
                setSelectedGenre(node);
                setActiveData(node.children);
                setViewMode('CLUSTER');
            }
        } else if (viewMode === 'CLUSTER') {
            // Clicked an Artist -> Show Detail Modal
            setSelectedArtist(node);
        }
    }, [viewMode]);

    const handleBack = () => {
        if (viewMode === 'CLUSTER') {
            setViewMode('GLOBAL');
            setActiveData(data); // Restore global
            setSelectedGenre(null);
        }
    };

    return (
        <div className="w-full h-full relative">
            {/* Canvas Layer */}
            <MusicCanvas
                nodes={activeData}
                mode={viewMode}
                onNodeClick={handleNodeClick}
            />

            {/* Navigation Overlay */}
            {viewMode === 'CLUSTER' && selectedGenre && (
                <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 bg-black/50 hover:bg-black/80 text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/20 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Galaxy</span>
                    </button>
                    <h2 className="text-2xl font-bold text-white shadow-black drop-shadow-md">
                        {selectedGenre.name}
                    </h2>
                </div>
            )}

            {/* Song Detail Modal (Artist) */}
            {selectedArtist && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={() => setSelectedArtist(null)}>
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                            <div>
                                <h2 className="text-2xl font-bold text-white">{selectedArtist.name}</h2>
                                <p className="text-sm text-zinc-400 mt-1">
                                    {selectedArtist.count} tracks in this collection
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedArtist(null)}
                                className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-zinc-400" />
                            </button>
                        </div>

                        {/* Song List */}
                        <div className="flex-1 overflow-y-auto p-0">
                            <table className="w-full text-left text-sm text-zinc-300">
                                <thead className="bg-zinc-950/50 sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="p-4 font-semibold text-zinc-500">Title</th>
                                        <th className="p-4 font-semibold text-zinc-500">Album</th>
                                        <th className="p-4 font-semibold text-zinc-500 text-right">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {selectedArtist.tracks?.map((track) => (
                                        <tr key={track.id}
                                            className="hover:bg-zinc-800/50 transition-colors group cursor-pointer"
                                            onClick={() => window.open(track.uri, '_blank')}
                                        >
                                            <td className="p-4">
                                                <div className="font-medium text-white group-hover:text-green-400 transition-colors">
                                                    {track.name}
                                                </div>
                                            </td>
                                            <td className="p-4 text-zinc-400">{track.album.name}</td>
                                            <td className="p-4 text-right font-mono text-xs text-zinc-500">
                                                {formatDuration(track.duration_ms)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatDuration(ms: number) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
}
