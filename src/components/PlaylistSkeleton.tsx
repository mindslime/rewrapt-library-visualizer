export default function PlaylistSkeleton() {
    return (
        <div className="flex flex-col gap-3 p-3 rounded-lg animate-pulse">
            {/* Image Placeholder */}
            <div className="aspect-square w-full bg-zinc-800 rounded-md" />

            {/* Text Placeholders */}
            <div className="flex flex-col gap-2">
                <div className="h-4 w-3/4 bg-zinc-800 rounded" />
                <div className="h-3 w-1/2 bg-zinc-800/60 rounded" />
            </div>
        </div>
    );
}
