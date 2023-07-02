
import { waitForElement } from "@owowed/oxi";
import { requireNonNull } from "@shared/util.ts";
import { createPbdDownloadManager, updatePbdDownloadManager } from "./illust";
import { PageEvent } from "./pixiv";

const pageEvent = new PageEvent;
let pbdDownloadManager: HTMLDivElement;

pageEvent.artworks.addEventListener("navigate-begin", async () => {
    pbdDownloadManager ??= await createPbdDownloadManager();
    const illustDesc = await waitForElement<HTMLDivElement>("figcaption:has(h1):has(footer) div:has(> footer)").then(requireNonNull);
    
    illustDesc.append(pbdDownloadManager);
});

pageEvent.artworks.addEventListener("navigate", () => {
    updatePbdDownloadManager(pbdDownloadManager);
});