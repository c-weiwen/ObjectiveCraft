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

    const headers = new Headers();
    headers.set('Content-Type', request.headers.get('Content-Type') || 'application/json');
    const auth = request.headers.get('Authorization');
    if (auth) headers.set('Authorization', auth);

    const response = await fetch(target, {
      method: request.method,
      headers,
      body: request.body,
    });

    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
