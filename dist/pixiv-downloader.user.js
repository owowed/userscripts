// ==UserScript==
// @name         Pixiv Bulk Downloader
// @namespace    owowed.moe
// @version      0.1.0
// @author       owowed <island@owowed.moe>
// @description  This script will bulk download single or multiple Pixiv artworks from an artist or illustration.
// @license      LGPL-3.0
// @homepage     https://github.com/owowed/userscripts
// @supportURL   https://github.com/owowed/userscripts/issues
// @downloadURL  https://github.com/owowed/userscripts/raw/dist/pixiv-downloader.user.js
// @updateURL    https://github.com/owowed/userscripts/raw/dist/pixiv-downloader.user.js
// @match        *://www.pixiv.net/*
// @require      https://github.com/owowed/oxi/raw/dist/oxi.umd.js
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
  var _pageEvent;
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
    const pbdDownloadManager2 = html`
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
    const pbdDownload = pbdDownloadManager2.querySelector("#pbd-download");
    const pbdBulkDownload = pbdDownloadManager2.querySelector("#pbd-bulk-download");
    const pbdSelect = pbdDownloadManager2.querySelector("select");
    const pbdFilename = pbdDownloadManager2.querySelector("#pbd-filename");
    const illustId = getIllustId();
    const illustPages = await fetchIllustPages(illustId);
    pbdFilename.addEventListener("change", () => {
      _GM_setValue("illust_filename", pbdFilename.value);
    });
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
    updatePbdDownloadManager(pbdDownloadManager2);
    return pbdDownloadManager2;
  }
  async function updatePbdDownloadManager(pbdDownloadManager2) {
    const pbdSelect = pbdDownloadManager2.querySelector("select");
    const pbdFilename = pbdDownloadManager2.querySelector("#pbd-filename");
    const illustId = getIllustId();
    const illustPages = await fetchIllustPages(illustId);
    pbdSelect.innerHTML = "";
    pbdFilename.value = _GM_getValue("illust_filename") ?? DEFAULT_FILENAME_FORMAT;
    for (const page of illustPages) {
      const partName = getIllustPagePartName(page.urls.original);
      const elem = html`<option value="${page.urls.original}">${partName}</option>`;
      pbdSelect.append(elem);
    }
  }
  class PageEvent extends EventTarget {
    constructor() {
      super();
      __publicField(this, "active", false);
      this.initAsync();
    }
    async initAsync() {
      const charcoal = await oxi.waitForElement(".charcoal-token > div", { maxTries: Infinity }).then(requireNonNull);
      if (!this.active) {
        this.dispatchEvent(new Event("navigate-begin"));
        this.dispatchEvent(new Event("navigate"));
        this.active = true;
      }
      oxi.makeMutationObserver({ target: charcoal, childList: true }, async () => {
        if (!this.active) {
          this.dispatchEvent(new Event("navigate-begin"));
          this.active = true;
        }
        this.dispatchEvent(new Event("navigate"));
      });
    }
  }
  class ArtworksEvent extends EventTarget {
    constructor() {
      super();
      __privateAdd(this, _pageEvent, new PageEvent());
      __publicField(this, "active", false);
      this.initAsync();
    }
    async initAsync() {
      __privateGet(this, _pageEvent).addEventListener("navigate", async () => {
        if (!window.location.pathname.includes("/artworks/"))
          return;
        this.dispatchEvent(new Event("navigate-begin"));
        this.dispatchEvent(new Event("navigate"));
        const illustDesc = await oxi.waitForElement("div:has(> figure):has(> figcaption)").then(requireNonNull);
        const observer = oxi.makeMutationObserver({ target: illustDesc, childList: true }, () => {
          this.dispatchEvent(new Event("navigate"));
        });
        __privateGet(this, _pageEvent).addEventListener("navigate", () => {
          this.dispatchEvent(new Event("navigate-end"));
          this.active = false;
          observer.disconnect();
        }, { once: true });
        this.active = true;
      });
    }
  }
  _pageEvent = new WeakMap();
  const artworksEvent = new ArtworksEvent();
  let pbdDownloadManager;
  artworksEvent.addEventListener("navigate-begin", async () => {
    pbdDownloadManager ?? (pbdDownloadManager = await createPbdDownloadManager());
    const illustDesc = await oxi.waitForElement("figcaption:has(h1):has(footer) div:has(> footer)").then(requireNonNull);
    illustDesc.append(pbdDownloadManager);
  });
  artworksEvent.addEventListener("navigate", () => {
    updatePbdDownloadManager(pbdDownloadManager);
  });

})(oxi);
