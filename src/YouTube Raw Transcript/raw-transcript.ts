import { makeMutationObserver, waitForElement, waitForElementByParent } from "@owowed/oxi";
import { requireNonNull, html } from "@shared/util.ts";

export class RawTranscript {
    #abortControllerQueue: AbortController[] = [];
    transcriptPanel?: Element;
    transcriptRenderer?: Element;

    activeButton: HTMLButtonElement;
    textBox: HTMLTextAreaElement;

    constructor() {
        this.activeButton = html<HTMLButtonElement>`<button id="ytrt-generate-btn">Raw Transcript</button>`;
        this.textBox = html<HTMLTextAreaElement>`<textarea id="ytrt-textarea" rows=20 placeholder="(raw transcript here)"/>`;

        this.activeButton.addEventListener("click", async () => {
            const transcriptSegmentTexts =  this.transcriptRenderer!.querySelectorAll("ytd-transcript-segment-renderer .segment-text");

            for (const text of transcriptSegmentTexts!) {
                this.textBox.value += `${text.textContent}\n`;
            }
        });
    }

    #clearAbortControllerQueue() {
        this.#abortControllerQueue.forEach(i => i.abort());
        this.#abortControllerQueue.length = 0;
    }

    #waitForElement(selector: string): Promise<Element> {
        const abortController = new AbortController;
        this.#abortControllerQueue.push(abortController);
        return waitForElement(selector, { maxTries: Infinity, abortSignal: abortController.signal })
            .then(requireNonNull);
    }

    #waitForElementByParent(parent: ParentNode, selector: string): Promise<Element> {
        const abortController = new AbortController;
        this.#abortControllerQueue.push(abortController);
        return waitForElement(selector, { parent, maxTries: Infinity, abortSignal: abortController.signal })
            .then(requireNonNull);
    }

    async regenerate() {
        this.#clearAbortControllerQueue();
        this.transcriptPanel = await this.#waitForElement(`#secondary #panels > [target-id$="transcript"]`);
        this.transcriptRenderer = undefined;

        const abortController = new AbortController;

        this.#abortControllerQueue.push(abortController);

        makeMutationObserver(
            { target: this.transcriptPanel,
                abortSignal: abortController.signal,
                attributes: true,
                attributeFilter: ["visibility", "target-id"] },
            async ({ records, observer }) =>
        {
            for (const record of records) {
                if (record.type != "attributes") continue;

                const target = record.target as Element;

                if (record.attributeName == "visibility" && target.getAttribute("visibility")?.endsWith("EXPANDED")) {
                    this.transcriptRenderer = await this.#waitForElementByParent(this.transcriptPanel!, "ytd-transcript-renderer");
                    const searchPanelHeader = await this.#waitForElementByParent(this.transcriptRenderer!, "ytd-transcript-search-panel-renderer #header");
                    const panels = document.querySelector("#panels");
                    searchPanelHeader.append(this.activeButton);
                    panels?.insertAdjacentElement("afterend", this.textBox);
                }
                else if (record.attributeName == "target-id" && !target.getAttribute("target-id")?.endsWith("transcript")) {
                    this.regenerate();
                }
            }
        });
    }

    async update() {}
}