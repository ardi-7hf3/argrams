function extractMeta(html, property) {
  const regex = new RegExp(`<meta property="${property}" content="([^"]*)"`)
  const match = html.match(regex)
  return match ? match[1] : null
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
    const exists = !!extractMeta(html, 'og:image')

    if (!exists) {
      res.status(404).json({
        error: 'Akun tidak ditemukan atau sedang dibatasi sementara oleh Instagram.',
        detail: `HTTP ${pageRes.status}, panjang HTML ${html.length}`,
      })
      return
    }

    // Instagram never exposes active story media through a logged-out,
    // public page — unlike posts/reels/profile pictures, viewing a story
    // always requires an authenticated session on Instagram's side.
    res.status(200).json({
      available: false,
      username,
      message:
        'Instagram mewajibkan login cuma untuk melihat story siapa pun, jadi story aktif tidak bisa diambil lewat cara publik seperti 2 fitur lain di ArGrams.',
    })
  } catch (err) {
    res.status(500).json({ error: 'Gagal memeriksa akun, coba lagi.', detail: String(err?.message || err) })
  }
}
