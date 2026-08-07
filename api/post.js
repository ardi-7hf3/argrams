function unescapeUrl(url) {
  return url.replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/\\u003D/g, '=')
}

function extractShortcode(url) {
  const match = url.match(/instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/)
  return match ? match[1] : null
}

export default async function handler(req, res) {
  const { url } = req.query
  const shortcode = url ? extractShortcode(url) : null

  if (!shortcode) {
    res.status(400).json({ error: 'Link postingan/reels tidak valid.' })
    return
  }

  try {
    const pageRes = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
    })
    const html = await pageRes.text()

    const videoMatch = html.match(/"video_url":"([^"]+)"/)
    const imageMatches = [...html.matchAll(/"display_url":"([^"]+)"/g)]
    const images = [...new Set(imageMatches.map((m) => unescapeUrl(m[1])))]

    if (!videoMatch && images.length === 0) {
      res.status(404).json({
        error: 'Media tidak ditemukan. Akun mungkin privat atau link tidak valid.',
        detail: `HTTP ${pageRes.status} — cuplikan respons: ${html.slice(0, 150).replace(/\s+/g, ' ')}`,
      })
      return
    }

    res.status(200).json({
      type: videoMatch ? 'video' : 'image',
      shortcode,
      video: videoMatch ? unescapeUrl(videoMatch[1]) : null,
      images,
    })
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil postingan, coba lagi.', detail: String(err?.message || err) })
  }
}
