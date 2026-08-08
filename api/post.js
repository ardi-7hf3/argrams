function extractMeta(html, property) {
  const regex = new RegExp(`<meta property="${property}" content="([^"]*)"`)
  const match = html.match(regex)
  return match ? match[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"') : null
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
    const pageRes = await fetch(`https://www.instagram.com/p/${shortcode}/`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
    })
    const html = await pageRes.text()

    const video = extractMeta(html, 'og:video:secure_url') || extractMeta(html, 'og:video')
    const image = extractMeta(html, 'og:image')

    if (!video && !image) {
      res.status(404).json({
        error: 'Media tidak ditemukan. Akun mungkin privat, link tidak valid, atau sedang dibatasi sementara oleh Instagram.',
        detail: `HTTP ${pageRes.status}, panjang HTML ${html.length}`,
      })
      return
    }

    res.status(200).json({
      type: video ? 'video' : 'image',
      shortcode,
      video: video || null,
      images: image ? [image] : [],
      note: !video && image ? 'Kalau ini carousel (banyak foto), cuma foto pertama yang bisa diambil lewat cara ini.' : null,
    })
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil postingan, coba lagi.', detail: String(err?.message || err) })
  }
}
