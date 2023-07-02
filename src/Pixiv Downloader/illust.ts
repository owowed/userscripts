
import { GM_download } from "$";
import { waitForElement } from "@owowed/oxi";
import { formatString } from "@shared/format.ts";
import { createElementFromHTML, requireNonNull } from "@shared/util.ts";

export interface IllustPage {
    urls: {
        thumb_mini: string;
        small: string;
        regular: string;
        original: string;
    }
    width: number;
    height: number;
}

const PAGES_URL = "https://www.pixiv.net/ajax/illust/${{ pixiv:id }}/pages?lang=en";

export async function fetchIllustPages(id: string): Promise<IllustPage[]> {
    const fetchUrl = formatString(PAGES_URL, {
        "pixiv:id": id
    });
    return fetch(fetchUrl).then(i => i.json()).then(i => i.body);
}

export function getIllustId() {
    return window.location.href.match(/\/artworks\/(\d+)/)![1];
}

export function getIllustFigCaption(isAsync: true): Promise<HTMLDivElement | null>;
export function getIllustFigCaption(isAsync: false): HTMLDivElement | null;
export function getIllustFigCaption(isAsync: boolean): any {
    if (isAsync) {
        return waitForElement<HTMLDivElement>("figcaption:has(div > footer):has(div > ul)");
    }
    else {
        return document.querySelector<HTMLDivElement>("figcaption:has(div > footer):has(div > ul)");
    }
}

export async function createPbdDownloadManager() {
    const pbdDownloadManager = createElementFromHTML<HTMLDivElement>(`
        <div id="pbd-download-manager">
            <button id="pbd-download">Download</button>
            <select></select>
        </div>
    `);
    
    updatePbdDownloadManager(pbdDownloadManager);

    return pbdDownloadManager;
}

export async function updatePbdDownloadManager(pbdDownloadManager: HTMLDivElement) {
    const pbdSelect = pbdDownloadManager.querySelector<HTMLSelectElement>("select")!;
    const pbdDownload = pbdDownloadManager.querySelector<HTMLButtonElement>("#pbd-download")!;

    const illustPages = await fetchIllustPages(getIllustId());

    pbdSelect.innerHTML = "";

    for (const page of illustPages) {
        const partName = page.urls.original.match(/_(p\d)/)![1];
        const elem = createElementFromHTML(`<option value="${page.urls.original}">${partName}</option>`)
        pbdSelect.append(elem);
    }

    pbdDownload.addEventListener("click", () => {
        GM_download(pbdSelect.value, getIllustId());
    });    
}