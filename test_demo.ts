import { DEMO_TRACKS, DEMO_ARTISTS } from "./src/data/demo-data";
import { transformTracksToNodes } from "./src/utils/spotifyTransform";

const artistMap = new Map(DEMO_ARTISTS.map((a: any) => [a.id, a]));
const nodes = transformTracksToNodes(DEMO_TRACKS, artistMap);

console.log(JSON.stringify(nodes, null, 2));
console.log("Nodes count:", nodes.length);
