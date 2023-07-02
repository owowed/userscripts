// ==UserScript==
// @name         Pixiv Bulk Downloader
// @namespace    owowed.moe
// @version      1.0.0
// @author       owowed <island@owowed.moe>
// @description  This script will bulk download multiple Pixiv artworks from the artist or artwork page in parrarel.
// @license      LGPL-3.0
// @homepage     https://github.com/owowed/owowed-userscripts
// @supportURL   https://github.com/owowed/owowed-userscripts/issues
// @downloadURL  https://github.com/owowed/owowed-userscripts/raw/dist/pixiv-downloader.user.js
// @updateURL    https://github.com/owowed/owowed-userscripts/raw/dist/pixiv-downloader.user.js
// @match        *://www.pixiv.net/*
// @require      https://github.com/owowed/oxi/raw/dist/oxi.umd.js
// @grant        GM_download
// ==/UserScript==

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
  var __privateSet = (obj, member, value, setter) => {
    __accessCheck(obj, member, "write to private field");
    setter ? setter.call(obj, value) : member.set(obj, value);
    return value;
  };
  var _firstTime, _pageState;
  function requireNonNull(obj) {
    if (obj != null) {
      return obj;
    }
    throw TypeError(`unexpected null`);
  }
  function createElementFromHTML(text) {
    const elem = document.createElement("div");
    elem.innerHTML = text;
    setTimeout(() => elem.remove());
    return elem.children[0];
  }
  var _GM_download = /* @__PURE__ */ (() => typeof GM_download != "undefined" ? GM_download : void 0)();
  function formatString(str, dict) {
    return str.replace(/\${{ ([^ ]+) }}/g, (_, varKey) => dict[varKey].toString());
  }
  const PAGES_URL = "https://www.pixiv.net/ajax/illust/${{ pixiv:id }}/pages?lang=en";
  async function fetchIllustPages(id) {
    const fetchUrl = formatString(PAGES_URL, {
      "pixiv:id": id
    });
    return fetch(fetchUrl).then((i) => i.json()).then((i) => i.body);
  }
  function getIllustId() {
    return window.location.href.match(/\/artworks\/(\d+)/)[1];
  }
  async function createPbdDownloadManager() {
    const pbdDownloadManager2 = createElementFromHTML(`
        <div id="pbd-download-manager">
            <button id="pbd-download">Download</button>
            <select></select>
        </div>
    `);
    updatePbdDownloadManager(pbdDownloadManager2);
    return pbdDownloadManager2;
  }
  async function updatePbdDownloadManager(pbdDownloadManager2) {
    const pbdSelect = pbdDownloadManager2.querySelector("select");
    const pbdDownload = pbdDownloadManager2.querySelector("#pbd-download");
    const illustPages = await fetchIllustPages(getIllustId());
    pbdSelect.innerHTML = "";
    for (const page of illustPages) {
      const partName = page.urls.original.match(/_(p\d)/)[1];
      const elem = createElementFromHTML(`<option value="${page.urls.original}">${partName}</option>`);
      pbdSelect.append(elem);
    }
    pbdDownload.addEventListener("click", () => {
      _GM_download(pbdSelect.value, getIllustId());
    });
  }
  class PageEvent {
    constructor() {
      __publicField(this, "root", new EventTarget());
      __publicField(this, "artworks", new EventTarget());
      __privateAdd(this, _firstTime, true);
      __privateAdd(this, _pageState, []);
      this.initAsync();
    }
    async initAsync() {
      const charcoal = await oxi.waitForElement(".charcoal-token > div", { maxTries: Infinity }).then(requireNonNull);
      await this.dispatchEvents();
      oxi.makeMutationObserver({ target: charcoal, childList: true }, async () => {
        await this.dispatchEvents();
      });
    }
    async dispatchEvents() {
      this.root.dispatchEvent(new Event("navigate"));
      if (__privateGet(this, _firstTime)) {
        this.root.dispatchEvent(new Event("navigate-begin"));
        __privateGet(this, _pageState).push("root");
        __privateSet(this, _firstTime, false);
      }
      if (window.location.href.includes("/artworks/")) {
        this.artworks.dispatchEvent(new Event("navigate-begin"));
        this.artworks.dispatchEvent(new Event("navigate"));
        const illustFigCaption = await oxi.waitForElement("div:has(> figure):has(> figcaption)").then(requireNonNull);
        const observer = oxi.makeMutationObserver({ target: illustFigCaption, childList: true, once: true }, () => {
          this.artworks.dispatchEvent(new Event("navigate"));
        });
        this.root.addEventListener("navigate", () => {
          observer.disconnect();
        }, { once: true });
        __privateGet(this, _pageState).push("artworks");
      } else {
        if (__privateGet(this, _pageState).includes("artworks")) {
          this.artworks.dispatchEvent(new Event("navigate-end"));
          __privateGet(this, _pageState).splice(__privateGet(this, _pageState).indexOf("artworks"), 1);
        }
      }
    }
  }
  _firstTime = new WeakMap();
  _pageState = new WeakMap();
  const pageEvent = new PageEvent();
  let pbdDownloadManager;
  pageEvent.artworks.addEventListener("navigate-begin", async () => {
    pbdDownloadManager ?? (pbdDownloadManager = await createPbdDownloadManager());
    const illustDesc = await oxi.waitForElement("figcaption:has(h1):has(footer) div:has(> footer)").then(requireNonNull);
    illustDesc.append(pbdDownloadManager);
  });
  pageEvent.artworks.addEventListener("navigate", () => {
    updatePbdDownloadManager(pbdDownloadManager);
  });

})(oxi);
