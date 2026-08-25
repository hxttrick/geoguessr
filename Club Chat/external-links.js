// ==UserScript==
// @name        Replace External Chat Links With Real Anchors
// @namespace   https://github.com/hxttrick/geoguessr
// @match       *://www.geoguessr.com/*
// @grant       none
// @version     1.0
// @author      hxttrick
// @run-at      document-idle
// ==/UserScript==

(function () {
  'use strict';

  const TARGET = 'club-chat-message_externalLink__wEtdo';
  const NEW_CLASS = 'next-link_anchor__CQUJ3';

  function isChatRoute(url = window.location) {
    try {
      const u = url instanceof URL ? url : new URL(url.href || String(url), window.location.href);
      return u.pathname === '/clubs/my' && new URLSearchParams(u.search).get('t') === 'chat';
    } catch {
      return false;
    }
  }

  function convert(el) {
    const text = (el.textContent || '').trim();
    if (!text) return;

    // Be tolerant of URLs without protocol
    let href = text;
    try { new URL(href); } catch { href = 'https://' + href; }

    let url;
    try {
      url = new URL(href);
    } catch {
      return; // skip if still not a valid URL
    }

    const a = document.createElement('a');
    a.href = url.href;
    a.textContent = text;
    a.className = NEW_CLASS;
    a.target = '_blank';
    a.rel = 'noopener';
    a.style.textDecoration = 'underline';

    el.replaceWith(a);
  }

  function processExisting() {
    document.querySelectorAll(`.${TARGET}`).forEach((el) => convert(el));
  }

  // ---- Observer (enabled only on /clubs/my?t=chat) ----
  let observer = null;

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.classList?.contains(TARGET)) {
            convert(node);
          } else {
            node.querySelectorAll?.(`.${TARGET}`).forEach(convert);
          }
        }
      }
    });

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });
  }

  function stopObserver() {
    if (!observer) return;
    observer.disconnect();
    observer = null;
  }

  function handleRouteChange() {
    if (isChatRoute(window.location)) {
      startObserver();
      processExisting();
    } else {
      stopObserver();
    }
  }

  // ---- Make Next.js SPA routing detectable ----
  (function hookHistory() {
    const wrap = (type) => {
      const orig = history[type];
      return function () {
        const ret = orig.apply(this, arguments);
        window.dispatchEvent(new Event('locationchange'));
        return ret;
      };
    };
    history.pushState = wrap('pushState');
    history.replaceState = wrap('replaceState');
    window.addEventListener('popstate', () => {
      window.dispatchEvent(new Event('locationchange'));
    });
  })();

  // React when the route changes
  window.addEventListener('locationchange', handleRouteChange);

  // Initial run
  handleRouteChange();
})();
