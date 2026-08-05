export default async function handler(req, res) {
  const { username } = req.query

  if (!username || typeof username !== 'string') {
    res.status(400).json({ error: 'Username tidak boleh kosong.' })
    return
  }

  try {
    const response = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      {
        headers: {
          'x-ig-app-id': '936619743392459',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        },
      }
    )
    const data = await response.json()
    const user = data?.data?.user

    if (!user) {
      res.status(404).json({ error: 'Akun tidak ditemukan.' })
      return
    }

    res.status(200).json({
      username: user.username,
      fullName: user.full_name || '',
      isPrivate: !!user.is_private,
      profilePic: user.profile_pic_url_hd || user.profile_pic_url,
    })
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil profil, coba lagi.' })
  }
}
