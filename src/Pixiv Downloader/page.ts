import { makeMutationObserver, waitForElement } from "@owowed/oxi";

export class PageEvent extends EventTarget {
    active = false;

    constructor () {
        super();
        this.initAsync();
    }

    async initAsync() {
        const charcoal = await waitForElement(".charcoal-token > div");

        if (!this.active) {
            this.dispatchEvent(new Event("navigate-begin"));
            this.dispatchEvent(new Event("navigate"));
            this.active = true;
        }

        makeMutationObserver({ target: charcoal, childList: true }, async () => {    
            if (!this.active) {
                this.dispatchEvent(new Event("navigate-begin"));
                this.active = true;
            }

            this.dispatchEvent(new Event("navigate"));
        });
    }
}

export class ArtworksEvent extends EventTarget {
    #pageEvent = new PageEvent;
    active = false;

    constructor () {
        super();
        this.initAsync();
    }

    async initAsync() {
        this.#pageEvent.addEventListener("navigate", async () => {
            if (!window.location.pathname.includes("/artworks/")) return;
    
            this.dispatchEvent(new Event("navigate-begin"));
            this.dispatchEvent(new Event("navigate"));
    
            const illustDesc = await waitForElement("div:has(> figure):has(> figcaption)");
    
            const observer = makeMutationObserver({ target: illustDesc, childList: true }, () => {
                this.dispatchEvent(new Event("navigate"));
            });
    
            this.#pageEvent.addEventListener("navigate", () => {
                this.dispatchEvent(new Event("navigate-end"));
                this.active = false;
                observer.disconnect();
            }, { once: true });
    
            this.active = true;
        });
    }
}

