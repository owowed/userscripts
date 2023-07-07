// ==UserScript==
// @name         YouTube Raw Transcript
// @namespace    owowed.moe
// @version      0.1.0
// @author       owowed <island@owowed.moe>
// @description  This script will generate a raw transcript from the video's subtitle, where you can extract its content.
// @license      LGPL-3.0
// @homepage     https://github.com/owowed/userscripts
// @supportURL   https://github.com/owowed/userscripts/issues
// @downloadURL  https://github.com/owowed/userscripts/raw/dist/youtube-transcript.user.js
// @updateURL    https://github.com/owowed/userscripts/raw/dist/youtube-transcript.user.js
// @match        *://www.youtube.com/*
// @require      https://github.com/owowed/oxi/raw/dist/oxi.umd.js
// @grant        GM_download
// ==/UserScript==

(t=>{const e=document.createElement("style");e.dataset.source="vite-plugin-monkey",e.textContent=t,document.head.append(e)})(" #ytrt-generate-btn{background-color:var(--yt-spec-badge-chip-background);padding:6px 10px;border:none;border-radius:3px;color:var(--yt-spec-text-primary);font-family:Roboto,Arial,sans-serif;cursor:pointer}#ytrt-generate-btn:hover{-webkit-backdrop-filter:brightness(1.4);backdrop-filter:brightness(1.4)}#ytrt-generate-btn:active{-webkit-backdrop-filter:brightness(1.8);backdrop-filter:brightness(1.8)}#ytrt-textarea{width:360px}ytd-transcript-search-panel-renderer>#header{padding:0 0 12px 12px} ");

(function (oxi) {
  'use strict';

  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };
  var __accessCheck = (obj, member, msg) => {
    if (!member.has(obj))
      throw TypeError("Cannot " + msg);
  };
  var __privateGet = (obj, member, getter) => {
    __accessCheck(obj, member, "read from private field");
    return getter ? getter.call(obj) : member.get(obj);
  };
  var __privateAdd = (obj, member, value) => {
    if (member.has(obj))
      throw TypeError("Cannot add the same private member more than once");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  };
  var __privateMethod = (obj, member, method) => {
    __accessCheck(obj, member, "access private method");
    return method;
  };
  var _abortControllerQueue, _clearAbortControllerQueue, clearAbortControllerQueue_fn, _waitForElement, waitForElement_fn, _waitForElementByParent, waitForElementByParent_fn;
  class WatchPageEvent extends EventTarget {
    constructor() {
      super();
      __publicField(this, "watchPageActive", false);
      document.addEventListener("yt-navigate-finish", () => {
        if (window.location.pathname.startsWith("/watch")) {
          if (!this.watchPageActive) {
            this.dispatchEvent(new Event("navigate-begin"));
          }
          this.dispatchEvent(new Event("navigate"));
          this.watchPageActive = true;
        } else {
          this.watchPageActive = false;
        }
      });
    }
  }
  function requireNonNull(obj) {
    if (obj != null && obj != void 0) {
      return obj;
    }
    throw TypeError(`unexpected null`);
  }
  function fromHTML(text) {
    const elem = document.createElement("div");
    elem.innerHTML = text;
    setTimeout(() => elem.remove());
    return elem.children[0];
  }
  const HTMLEntityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;"
  };
  function escapeHTML(text) {
    return text.replace(/[&<>"'`=\/]/g, (s) => HTMLEntityMap[s]);
  }
  function html(template, ...subst) {
    const completeString = [];
    for (let i = 0; i < template.length; i++) {
      completeString.push(template[i]);
      if (subst[i])
        completeString.push(escapeHTML(String(subst[i])));
    }
    return fromHTML(completeString.join(""));
  }
  class RawTranscript {
    constructor() {
      __privateAdd(this, _clearAbortControllerQueue);
      __privateAdd(this, _waitForElement);
      __privateAdd(this, _waitForElementByParent);
      __privateAdd(this, _abortControllerQueue, []);
      __publicField(this, "transcriptPanel");
      __publicField(this, "transcriptRenderer");
      __publicField(this, "activeButton");
      __publicField(this, "textBox");
      this.activeButton = html`<button id="ytrt-generate-btn">Raw Transcript</button>`;
      this.textBox = html`<textarea id="ytrt-textarea" rows=20 placeholder="(raw transcript here)"/>`;
      this.activeButton.addEventListener("click", async () => {
        const transcriptSegmentTexts = this.transcriptRenderer.querySelectorAll("ytd-transcript-segment-renderer .segment-text");
        for (const text of transcriptSegmentTexts) {
          this.textBox.value += `${text.textContent}
`;
        }
      });
    }
    async regenerate() {
      __privateMethod(this, _clearAbortControllerQueue, clearAbortControllerQueue_fn).call(this);
      this.transcriptPanel = await __privateMethod(this, _waitForElement, waitForElement_fn).call(this, `#secondary #panels > [target-id$="transcript"]`);
      this.transcriptRenderer = void 0;
      const abortController = new AbortController();
      __privateGet(this, _abortControllerQueue).push(abortController);
      oxi.makeMutationObserver(
        {
          target: this.transcriptPanel,
          abortSignal: abortController.signal,
          attributes: true,
          attributeFilter: ["visibility", "target-id"]
        },
        async ({ records, observer }) => {
          var _a, _b;
          for (const record of records) {
            if (record.type != "attributes")
              continue;
            const target = record.target;
            if (record.attributeName == "visibility" && ((_a = target.getAttribute("visibility")) == null ? void 0 : _a.endsWith("EXPANDED"))) {
              this.transcriptRenderer = await __privateMethod(this, _waitForElementByParent, waitForElementByParent_fn).call(this, this.transcriptPanel, "ytd-transcript-renderer");
              const searchPanelHeader = await __privateMethod(this, _waitForElementByParent, waitForElementByParent_fn).call(this, this.transcriptRenderer, "ytd-transcript-search-panel-renderer #header");
              const panels = document.querySelector("#panels");
              searchPanelHeader.append(this.activeButton);
              panels == null ? void 0 : panels.insertAdjacentElement("afterend", this.textBox);
            } else if (record.attributeName == "target-id" && !((_b = target.getAttribute("target-id")) == null ? void 0 : _b.endsWith("transcript"))) {
              this.regenerate();
            }
          }
        }
      );
    }
    async update() {
    }
  }
  _abortControllerQueue = new WeakMap();
  _clearAbortControllerQueue = new WeakSet();
  clearAbortControllerQueue_fn = function() {
    __privateGet(this, _abortControllerQueue).forEach((i) => i.abort());
    __privateGet(this, _abortControllerQueue).length = 0;
  };
  _waitForElement = new WeakSet();
  waitForElement_fn = function(selector) {
    const abortController = new AbortController();
    __privateGet(this, _abortControllerQueue).push(abortController);
    return oxi.waitForElement(selector, { maxTries: Infinity, abortSignal: abortController.signal }).then(requireNonNull);
  };
  _waitForElementByParent = new WeakSet();
  waitForElementByParent_fn = function(parent, selector) {
    const abortController = new AbortController();
    __privateGet(this, _abortControllerQueue).push(abortController);
    return oxi.waitForElement(selector, { parent, maxTries: Infinity, abortSignal: abortController.signal }).then(requireNonNull);
  };
  const watchPageEvent = new WatchPageEvent();
  const rawTranscript = new RawTranscript();
  watchPageEvent.addEventListener("navigate-begin", () => {
    rawTranscript.regenerate();
  });

})(oxi);
