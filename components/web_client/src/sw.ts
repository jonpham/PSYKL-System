/// <reference lib="WebWorker" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

import { replay } from './sync/replay';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ revision: string | null; url: string }>;
};

type SyncEvent = Event & {
  tag: string;
  waitUntil: (promise: Promise<unknown>) => void;
};

const serviceTaskOrigin = 'http://localhost:3000';
const sourceMarker = 'PSYKL owned service worker';
const syncTag = 'psykl-sync';

clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));

registerRoute(
  ({ request, url }) =>
    request.method === 'GET' &&
    url.origin === serviceTaskOrigin &&
    url.pathname === '/tasks' &&
    !url.searchParams.has('include_deleted'),
  new StaleWhileRevalidate({ cacheName: 'psykl-task-reads' }),
);

self.addEventListener('message', (event) => {
  const type = (event.data as { type?: string } | undefined)?.type;
  if (type === 'PSYKL_SW_SOURCE') {
    event.source?.postMessage({ source: sourceMarker });
  }
  // Settings → About → "Update to latest version". Without this a replacement
  // worker waits until every client closes, which on an installed iOS PWA
  // effectively never happens.
  if (type === 'PSYKL_SKIP_WAITING') {
    void self.skipWaiting();
  }
});

self.addEventListener('sync', (event) => {
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag === syncTag) {
    syncEvent.waitUntil(replay({ owner: 'service-worker' }));
  }
});
