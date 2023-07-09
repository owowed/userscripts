
import "./style.css";

import { WatchPageEvent } from "./page";
import { RawTranscript } from "./raw-transcript";

const watchPageEvent = new WatchPageEvent;
const rawTranscript = new RawTranscript;

watchPageEvent.addEventListener("navigate-begin", () => {
    rawTranscript.regenerate();
});

watchPageEvent.addEventListener("navigate", () => {
    rawTranscript.update();
});