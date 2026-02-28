export interface TourStep {
    id: string;
    target: string; // The data-tour attribute value or CSS selector
    title: string;
    description: string;
    requiresAction?: boolean; // If true, the tour pauses here and waits for the user to click the target element
    allowInteraction?: boolean; // If true, allows the user to click the target element without skipping the tour, while still showing the "Next" button
    preventDrillDown?: boolean; // If true, prevents clicking into clusters/artists during this step
    noOverlay?: boolean; // If true, hides the dark background and spotlight cutout
    disableViewSwitcher?: boolean; // If true, disables the Cluster/Timeline switcher in the header
    disableBackToDashboard?: boolean; // If true, disables the main "Back" button to the playlist library
    isCentered?: boolean; // If true, centers the tooltip on the screen regardless of the target element's position
}

export const TOUR_STEPS: TourStep[] = [
    {
        id: "welcome",
        target: "body",
        title: "Welcome to your Music Map",
        description: "Ready to explore the soundtrack of your life? Let's take a quick tour to show you how to navigate your listening history.",
    },
    {
        id: "playlists-section",
        target: "[data-tour='playlists-section']",
        title: "Your Playlists",
        description: "These are your current playlists. To examine individual playlist data/genres, you can click on any.",
    },
    {
        id: "analyze-button",
        target: "[data-tour='analyze-button']",
        title: "Analyze Liked Music",
        description: "This button will analyze your entire library to show all the music you've liked.\nNote: Libraries with large amounts of liked music will take time to load.",
    },
    {
        id: "action-phase",
        target: "[data-tour='action-container']",
        title: "Dive In",
        description: "Click any playlist or 'Analyze Liked Music' to see your music data.",
        requiresAction: true,
    },
    {
        id: "map-basics",
        target: "[data-tour='map-canvas']",
        title: "Explore Your Universe",
        description: "Click and drag to pan around. Scroll or pinch to zoom in and out of the map. See how your favorite genres cluster together.",
        allowInteraction: true,
        preventDrillDown: true,
        disableBackToDashboard: true,
        isCentered: true,
    },
    {
        id: "genre-drilldown",
        target: "[data-tour='map-canvas']",
        title: "Focus on a Genre",
        description: "Click a genre circle to see the artists within that cluster. The timeline is disabled for now so you can focus on the map basics.",
        requiresAction: true,
        disableViewSwitcher: true,
        disableBackToDashboard: true,
    },
    {
        id: "artist-clusters",
        target: "[data-tour='map-canvas']",
        title: "Artist Clusters",
        description: "Now you're inside a genre cluster! Each smaller circle represents an artist. Clicking one would normally show their tracks, but let's keep moving.",
        allowInteraction: true,
        preventDrillDown: true,
        disableBackToDashboard: true,
        disableViewSwitcher: true,
    },
    {
        id: "timeline-container",
        target: "[data-tour='timeline-container']",
        title: "Travel Through Time",
        description: "Use the timeline to see how your listening habits evolved. Zoom and drag to navigate through different periods.",
        allowInteraction: true,
        disableBackToDashboard: true,
    },
    {
        id: "time-points",
        target: "[data-tour='time-points']",
        title: "Exact Moments",
        description: "Hover over any point on the timeline to reveal specific details about that period in your musical journey.",
        allowInteraction: true,
        disableBackToDashboard: true,
    }
];
