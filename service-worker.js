const CACHE_PREFIX = 'ios-analytics-parser-';
// Developer checklist: if any precached asset changes, bump CACHE_VERSION.
// Precached assets include index.html, styles/main.css, src modules, examples,
// manifest, icons, and the service-worker allowlist itself.
const CACHE_VERSION = 'v0.8.0-alpha-slice8b-accessibility-polish-2026-07-02';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/main.css',
  './src/main.js',
  './src/appState.js',
  './src/fileValidation.js',
  './src/explanations/diagnosticExplanations.js',
  './src/models/reportSize.js',
  './src/models/sectionModel.js',
  './src/privacy/sanitize.js',
  './src/search/filterSections.js',
  './src/search/searchMetadata.js',
  './src/clipboard/copyMetadata.js',
  './src/clipboard/serializeSection.js',
  './src/clipboard/visibleSection.js',
  './src/ui/coreAnalyticsView.js',
  './src/ui/denseTables.js',
  './src/ui/renderApp.js',
  './src/ui/renderCoreAnalyticsOverview.js',
  './src/ui/renderSection.js',
  './src/ui/renderSectionNav.js',
  './src/ui/tableView.js',
  './src/parsers/detect.js',
  './src/parsers/classifyDiagnostic.js',
  './src/parsers/index.js',
  './src/parsers/parseAccessoryCrash.js',
  './src/parsers/parseAnalytics.js',
  './src/parsers/parseCoreAnalytics.js',
  './src/parsers/parseCrash.js',
  './src/parsers/parseCpuResource.js',
  './src/parsers/parseDiskWritesResource.js',
  './src/parsers/parseIps.js',
  './src/parsers/parseIpsContainer.js',
  './src/parsers/parseIpsWatchdogStackshot.js',
  './src/parsers/parseJetsam.js',
  './src/parsers/parsePanic.js',
  './src/parsers/parsePanicStub.js',
  './src/parsers/parseResourceStackshot.js',
  './icons/favicon.svg',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './examples/manifest.js',
  './examples/app-crash.ips',
  './examples/legacy.crash',
  './examples/watchdog.ips',
  './examples/jetsam-event.ips',
  './examples/panic-full.ips',
  './examples/analytics.txt',
];

const ALLOWLIST_URLS = new Set(PRECACHE_URLS.map((path) => normalizeHref(new URL(path, self.location.href))));
const INDEX_URL = normalizeHref(new URL('./index.html', self.location.href));

function normalizeHref(url) {
  const normalized = new URL(url.href);
  normalized.hash = '';
  normalized.search = '';
  return normalized.href;
}

function isAllowedRequest(request) {
  if (request.method !== 'GET') return false;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;

  return ALLOWLIST_URLS.has(normalizeHref(url));
}

async function cacheFirstAllowedAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cacheKey = normalizeHref(new URL(request.url));
  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) return cachedResponse;

  return fetch(request);
}

async function navigationFallback(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedIndex = await cache.match(INDEX_URL);
  if (cachedIndex) return cachedIndex;

  return fetch(request);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isAllowedRequest(request)) {
    event.respondWith(cacheFirstAllowedAsset(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(navigationFallback(request));
  }
});
