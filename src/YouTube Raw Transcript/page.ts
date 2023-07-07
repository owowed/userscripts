
export class WatchPageEvent extends EventTarget {
    watchPageActive = false;

    constructor () {
        super();

        document.addEventListener("yt-navigate-finish", () => {
            if (window.location.pathname.startsWith("/watch")) {
                if (!this.watchPageActive) {
                    this.dispatchEvent(new Event("navigate-begin"));
                }
                this.dispatchEvent(new Event("navigate"));
                this.watchPageActive = true;
            }
            else {
                this.watchPageActive = false;
            }
        });
    }
}