import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
    try {
        // Try to serve the static asset
        return await getAssetFromKV(event);
    } catch (e) {
        // If not found, serve index.html (SPA fallback)
        try {
            const notFoundResponse = await getAssetFromKV(event, {
                mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/index.html`, req),
            });
            return new Response(notFoundResponse.body, {
                ...notFoundResponse,
                status: 200,
            });
        } catch (e2) {
            return new Response('Not found', { status: 404 });
        }
    }
}
