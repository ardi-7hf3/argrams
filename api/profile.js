function extractMeta(html, property) {
  const regex = new RegExp(`<meta property="${property}" content="([^"]*)"`)
  const match = html.match(regex)
  return match ? match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : null
}

export default async function handler(req, res) {
  const { username } = req.query

  if (!username || typeof username !== 'string') {
    res.status(400).json({ error: 'Username tidak boleh kosong.' })
    return
  }

  try {
    const pageRes = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
    })
    const html = await pageRes.text()

    const profilePic = extractMeta(html, 'og:image')
    const title = extractMeta(html, 'og:title')

    if (!profilePic) {
      res.status(404).json({
        error: 'Foto profil tidak ditemukan. Akun mungkin privat, tidak ada, atau sedang dibatasi sementara oleh Instagram.',
        detail: `HTTP ${pageRes.status}, panjang HTML ${html.length}`,
      })
      return
    }

    res.status(200).json({
      username,
      fullName: title ? title.split(' (@')[0] : '',
      profilePic,
    })
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil profil, coba lagi.', detail: String(err?.message || err) })
  }
}
