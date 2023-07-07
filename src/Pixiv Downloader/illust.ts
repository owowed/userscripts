
import { GM_download, GM_getValue, GM_setValue } from "$";
import { waitForElement } from "@owowed/oxi";
import { formatString } from "@shared/format.ts";
import { html, requireNonNull } from "@shared/util.ts";
import { Illust, IllustPage, UserIllust } from "./illust-types";

export type * from "./illust-types";

export const ILLUST_URL = "https://www.pixiv.net/ajax/illust/${{ pixiv:illust_id }}?lang=en";
export const ILLUST_PAGES_URL = "https://www.pixiv.net/ajax/illust/${{ pixiv:illust_id }}/pages?lang=en";
export const USER_ILLUSTS_URL = "https://www.pixiv.net/ajax/user/2455233/illusts?${{ pixiv:illust_ids }}&lang=en";

export const DEFAULT_FILENAME_FORMAT = "%illust_title% [artist %illust_author%][pixiv %illust_id%].%illust_filename_ext%";

export function fetchIllust(illustId: string): Promise<Illust> {
    const fetchUrl = formatString(ILLUST_URL, {
        "pixiv:illust_id": illustId
    });

    return fetch(fetchUrl).then(i => i.json()).then(i => i.body);
}

export async function fetchIllustPages(illustId: string): Promise<IllustPage[]> {
    const fetchUrl = formatString(ILLUST_PAGES_URL, {
        "pixiv:illust_id": illustId
    });

    return fetch(fetchUrl).then(i => i.json()).then(i => i.body);
}

export function fetchUserIllusts(userId: number, illustIds: string[]): Promise<Record<number, UserIllust>> {
    let illustIdsUrlQuery = [];
    const idsKey = encodeURIComponent("ids[]");

    for (const illustId of illustIds) {
        illustIdsUrlQuery.push(`${idsKey}=${illustId}`);
    }

    const fetchUrl = formatString(USER_ILLUSTS_URL, {
        "pixiv:illust_ids": illustIdsUrlQuery.join("&")
    });

    return fetch(fetchUrl).then(i => i.json()).then(i => i.body);
}

export function getIllustPagePartName(pageUrl: string): string | undefined {
    return pageUrl.match(/_(p\d)/)?.[1];
}

export function getIllustPageFilename(illustId: string, pageUrl: string): Promise<string | undefined> {
    const partName = getIllustPagePartName(pageUrl);
    const fileExt = pageUrl.match(/\w+$/)?.[0];

    if (partName == undefined || fileExt == undefined) return Promise.resolve(undefined);

    const pbdFilename = document.querySelector<HTMLInputElement>("#pbd-filename")!;

    return formatIllustInfo(illustId, pbdFilename.value, {
        illust_part: partName,
        illust_filename_ext: fileExt,
    });
}

export async function formatIllustInfo(
        illustId: string,
        text?: string,
        dict: Record<string, string> = {}): Promise<string> {
    text ||= DEFAULT_FILENAME_FORMAT;

    const illust = await fetchIllust(illustId);

    const result = formatString(text, {
        illust_id: illust.id,
        illust_title: illust.title,
        illust_author: illust.userName,
        illust_author_id: illust.userId,
        illust_views: illust.viewCount,
        illust_likes: illust.likeCount,
        illust_bookmarks: illust.bookmarkCount,
        illust_bookmarkable: illust.isBookmarkable,
        ...dict
    }, {
        subst: {
            format: "%|%",
            var: "|"
        }
    });

    return result;
}

export function getIllustAuthorId() {
    const viewAllWorksAnchor = document.querySelector<HTMLAnchorElement>('a[href*="users/"][href$="/artworks"]');

    if (!viewAllWorksAnchor) return null;

    return parseInt(viewAllWorksAnchor.href.match(/\/users\/(\d+)/)![1]);
}

export function getIllustId() {
    return window.location.href.match(/\/artworks\/(\d+)/)![1];
}

export function getIllustFigCaptionAsync(): Promise<HTMLDivElement | null> {
    return waitForElement<HTMLDivElement>("figcaption:has(div > footer):has(div > ul)");
}

export function getIllustFigCaption(): any {
    return document.querySelector<HTMLDivElement>("figcaption:has(div > footer):has(div > ul)");
}

export async function createPbdDownloadManager() {
    const pbdDownloadManager = html<HTMLDivElement>`
        <div id="pbd-download-manager">
            <input id="pbd-filename" type="text" placeholder="Artwork filename..."/>
            <div>
                <button id="pbd-download">Download</button>
                <select></select>
                or
                <button id="pbd-bulk-download">Bulk Download</button>
            </div>
        </div>
    `;
    
    
    const pbdDownload = pbdDownloadManager.querySelector<HTMLButtonElement>("#pbd-download")!;
    const pbdBulkDownload = pbdDownloadManager.querySelector<HTMLButtonElement>("#pbd-bulk-download")!;
    const pbdSelect = pbdDownloadManager.querySelector<HTMLSelectElement>("select")!;
    const pbdFilename = pbdDownloadManager.querySelector<HTMLInputElement>("#pbd-filename")!;

    const illustId = getIllustId();
    const illustPages = await fetchIllustPages(illustId);

    pbdFilename.addEventListener("change", () => {
        GM_setValue("illust_filename", pbdFilename.value);
    });
    
    const template = {
        headers: {
            Referer: "https://www.pixiv.net/"
        }
    };

    pbdDownload.addEventListener("click", async () => {
        GM_download({
            ...template,
            name: await getIllustPageFilename(illustId, pbdSelect.value).then(requireNonNull),
            url: pbdSelect.value,
        });
    });

    pbdBulkDownload.addEventListener("click", async () => {
        for (const page of illustPages) {
            GM_download({
                ...template,
                name: await getIllustPageFilename(illustId, page.urls.original).then(requireNonNull),
                url: page.urls.original,
            });
        }
    });

    updatePbdDownloadManager(pbdDownloadManager);

    return pbdDownloadManager;
}

export async function updatePbdDownloadManager(pbdDownloadManager: HTMLDivElement) {
    const pbdSelect = pbdDownloadManager.querySelector<HTMLSelectElement>("select")!;
    const pbdFilename = pbdDownloadManager.querySelector<HTMLInputElement>("#pbd-filename")!;
    
    const illustId = getIllustId();
    const illustPages = await fetchIllustPages(illustId);

    pbdSelect.innerHTML = "";
    pbdFilename.value = GM_getValue("illust_filename") ?? DEFAULT_FILENAME_FORMAT;

    for (const page of illustPages) {
        const partName = getIllustPagePartName(page.urls.original)!;
        const elem = html<HTMLOptionElement>`<option value="${page.urls.original}">${partName}</option>`;
        pbdSelect.append(elem);
    }
}