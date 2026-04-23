export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const url = new URL(request.url);
    const target = 'https://apifreellm.com' + url.pathname + url.search;

    const response = await fetch(target, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    const proxied = new Response(response.body, response);
    proxied.headers.set('Access-Control-Allow-Origin', '*');
    return proxied;
  },
};
