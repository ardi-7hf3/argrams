export const config = { runtime: 'edge' }

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const fileUrl = searchParams.get('url')
  const filename = searchParams.get('name') || 'argrams-file'

  if (!fileUrl || !/^https:\/\//i.test(fileUrl)) {
    return new Response('Missing or invalid url', { status: 400 })
  }

  try {
    const upstream = await fetch(fileUrl, {
      headers: {
        Referer: 'https://www.instagram.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
    })
    if (!upstream.ok || !upstream.body) {
      return new Response('Failed to fetch file', { status: 502 })
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return new Response('Proxy error', { status: 500 })
  }
}
