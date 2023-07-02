import { makeMutationObserver, waitForElement } from "@owowed/oxi";
import { requireNonNull } from "@shared/util.ts";

export class PageEvent {
    root = new EventTarget;
    artworks = new EventTarget;

    #firstTime = true;
    #pageState: Array<"root" | "artworks"> = [];

    constructor () {
        this.initAsync();
    }

    async initAsync() {
        const charcoal = await waitForElement(".charcoal-token > div", { maxTries: Infinity }).then(requireNonNull);

        await this.dispatchEvents();

        makeMutationObserver({ target: charcoal, childList: true }, async () => {
            await this.dispatchEvents();
        });
    }

    async dispatchEvents() {
        this.root.dispatchEvent(new Event("navigate"));

        if (this.#firstTime) {
            this.root.dispatchEvent(new Event("navigate-begin"));
            this.#pageState.push("root");
            this.#firstTime = false;
        }

        if (window.location.href.includes("/artworks/")) {
            this.artworks.dispatchEvent(new Event("navigate-begin"));
            this.artworks.dispatchEvent(new Event("navigate"));
            
            const illustDesc = await waitForElement("div:has(> figure):has(> figcaption)").then(requireNonNull);

            const observer = makeMutationObserver({ target: illustDesc, childList: true }, () => {
                this.artworks.dispatchEvent(new Event("navigate"));
            });

            this.root.addEventListener("navigate", () => {
                this.artworks.dispatchEvent(new Event("navigate-end"));
                this.#pageState.splice(this.#pageState.indexOf("artworks"), 1);
                observer.disconnect();
            }, { once: true });

            this.#pageState.push("artworks");
        }
    }
}



