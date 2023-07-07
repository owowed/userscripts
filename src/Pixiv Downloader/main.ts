
import "./style.css";

import { waitForElement } from "@owowed/oxi";
import { requireNonNull } from "@shared/util.ts";
import { createPbdDownloadManager, updatePbdDownloadManager } from "./illust";
import { ArtworksEvent } from "./page";

const artworksEvent = new ArtworksEvent;

let pbdDownloadManager: HTMLDivElement;

artworksEvent.addEventListener("navigate-begin", async () => {
    pbdDownloadManager ??= await createPbdDownloadManager();
    const illustDesc = await waitForElement<HTMLDivElement>("figcaption:has(h1):has(footer) div:has(> footer)").then(requireNonNull);
    
    illustDesc.append(pbdDownloadManager);
});

artworksEvent.addEventListener("navigate", () => {
    updatePbdDownloadManager(pbdDownloadManager);
});
