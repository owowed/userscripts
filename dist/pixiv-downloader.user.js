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
// @grant        GM_addStyle
// @grant        GM_download
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(t=>{const e=document.createElement("style");e.dataset.source="vite-plugin-monkey",e.textContent=t,document.head.append(e)})(" #pbd-download-manager{display:flex;flex-direction:column;gap:2px;margin-top:12px}#pbd-filename{width:10cm} ");

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
  var _GM_download = /* @__PURE__ */ (() => typeof GM_download != "undefined" ? GM_download : void 0)();
  var _GM_getValue = /* @__PURE__ */ (() => typeof GM_getValue != "undefined" ? GM_getValue : void 0)();
  var _GM_setValue = /* @__PURE__ */ (() => typeof GM_setValue != "undefined" ? GM_setValue : void 0)();
  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function formatString(text, dict, { subst = { format: "${{ | }}", var: "|" } } = {}) {
    const substRegex = subst.format.split(subst.var).map(escapeRegExp).join(String.raw`([$\w\d-_.: ]+)`);
    return text.replace(new RegExp(substRegex, "g"), (_, varKey) => {
      var _a;
      return (_a = dict[varKey]) == null ? void 0 : _a.toString();
    });
  }
  const ILLUST_URL = "https://www.pixiv.net/ajax/illust/${{ pixiv:illust_id }}?lang=en";
  const ILLUST_PAGES_URL = "https://www.pixiv.net/ajax/illust/${{ pixiv:illust_id }}/pages?lang=en";
  const DEFAULT_FILENAME_FORMAT = "%illust_title% [artist %illust_author%][pixiv %illust_id%].%illust_filename_ext%";
  function fetchIllust(illustId) {
    const fetchUrl = formatString(ILLUST_URL, {
      "pixiv:illust_id": illustId
    });
    return fetch(fetchUrl).then((i) => i.json()).then((i) => i.body);
  }
  async function fetchIllustPages(illustId) {
    const fetchUrl = formatString(ILLUST_PAGES_URL, {
      "pixiv:illust_id": illustId
    });
    return fetch(fetchUrl).then((i) => i.json()).then((i) => i.body);
  }
  function getIllustPagePartName(pageUrl) {
    var _a;
    return (_a = pageUrl.match(/_(p\d)/)) == null ? void 0 : _a[1];
  }
  function getIllustPageFilename(illustId, pageUrl) {
    var _a;
    const partName = getIllustPagePartName(pageUrl);
    const fileExt = (_a = pageUrl.match(/\w+$/)) == null ? void 0 : _a[0];
    if (partName == void 0 || fileExt == void 0)
      return Promise.resolve(void 0);
    const pbdFilename = document.querySelector("#pbd-filename");
    return formatIllustInfo(illustId, pbdFilename.value, {
      illust_part: partName,
      illust_filename_ext: fileExt
    });
  }
  async function formatIllustInfo(illustId, text, dict = {}) {
    text || (text = DEFAULT_FILENAME_FORMAT);
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
  function getIllustId() {
    return window.location.href.match(/\/artworks\/(\d+)/)[1];
  }
  async function createPbdDownloadManager() {
    const pbdDownloadManager2 = fromHTML(`
        <div id="pbd-download-manager">
            <input id="pbd-filename" type="text" placeholder="Artwork filename..."/>
            <div>
                <button id="pbd-download">Download</button>
                <select></select>
                or
                <button id="pbd-bulk-download">Bulk Download</button>
            </div>
        </div>
    `);
    updatePbdDownloadManager(pbdDownloadManager2);
    return pbdDownloadManager2;
  }
  async function updatePbdDownloadManager(pbdDownloadManager2) {
    const pbdSelect = pbdDownloadManager2.querySelector("select");
    const pbdDownload = pbdDownloadManager2.querySelector("#pbd-download");
    const pbdBulkDownload = pbdDownloadManager2.querySelector("#pbd-bulk-download");
    const pbdFilename = pbdDownloadManager2.querySelector("#pbd-filename");
    const illustId = getIllustId();
    const illustPages = await fetchIllustPages(illustId);
    pbdSelect.innerHTML = "";
    pbdFilename.value = _GM_getValue("illust_filename") ?? DEFAULT_FILENAME_FORMAT;
    pbdFilename.addEventListener("change", () => {
      _GM_setValue("illust_filename", pbdFilename.value);
    });
    for (const page of illustPages) {
      const partName = getIllustPagePartName(page.urls.original);
      const elem = fromHTML(`<option value="${page.urls.original}">${partName}</option>`);
      pbdSelect.append(elem);
    }
    const template = {
      headers: {
        Referer: "https://www.pixiv.net/"
      }
    };
    pbdDownload.addEventListener("click", async () => {
      _GM_download({
        ...template,
        name: await getIllustPageFilename(illustId, pbdSelect.value).then(requireNonNull),
        url: pbdSelect.value
      });
    });
    pbdBulkDownload.addEventListener("click", async () => {
      for (const page of illustPages) {
        _GM_download({
          ...template,
          name: await getIllustPageFilename(illustId, page.urls.original).then(requireNonNull),
          url: page.urls.original
        });
      }
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
        const illustDesc = await oxi.waitForElement("div:has(> figure):has(> figcaption)").then(requireNonNull);
        const observer = oxi.makeMutationObserver({ target: illustDesc, childList: true }, () => {
          this.artworks.dispatchEvent(new Event("navigate"));
        });
        this.root.addEventListener("navigate", () => {
          this.artworks.dispatchEvent(new Event("navigate-end"));
          __privateGet(this, _pageState).splice(__privateGet(this, _pageState).indexOf("artworks"), 1);
          observer.disconnect();
        }, { once: true });
        __privateGet(this, _pageState).push("artworks");
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
