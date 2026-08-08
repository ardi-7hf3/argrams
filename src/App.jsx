import { useState } from 'react'

const ENDPOINTS = {
  post: '/api/post',
  profile: '/api/profile',
  story: '/api/story',
}
const PROXY = '/api/proxy'

const TABS = [
  { id: 'post', label: 'Postingan & Reels' },
  { id: 'profile', label: 'Foto Profil' },
  { id: 'story', label: 'Story' },
]

function sanitizeFilename(name) {
  return String(name || 'argrams').replace(/[^a-zA-Z0-9_-]/g, '_')
}

function proxied(fileUrl, filename) {
  return `${PROXY}?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(filename)}`
}

function extractPostUrl(text) {
  const match = text.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels)\/[A-Za-z0-9_-]+\/?\S*/i)
  return match ? match[0] : null
}

function extractUsername(text) {
  const trimmed = text.trim().replace(/^@/, '')
  const urlMatch = trimmed.match(/instagram\.com\/([A-Za-z0-9_.]+)/i)
  if (urlMatch) return urlMatch[1]
  return /^[A-Za-z0-9_.]{1,30}$/.test(trimmed) ? trimmed : null
}

export default function App() {
  const [tab, setTab] = useState('post')
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [errorDetail, setErrorDetail] = useState('')

  function switchTab(id) {
    setTab(id)
    setInput('')
    setStatus('idle')
    setResult(null)
    setError('')
    setErrorDetail('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    let query
    if (tab === 'post') {
      query = extractPostUrl(input)
      if (!query) {
        setStatus('error')
        setError('Link postingan/reels Instagram tidak ditemukan di teks ini.')
        return
      }
    } else {
      query = extractUsername(input)
      if (!query) {
        setStatus('error')
        setError('Masukkan username yang valid.')
        return
      }
    }

    setStatus('loading')
    setError('')
    setErrorDetail('')
    try {
      const param = tab === 'post' ? 'url' : 'username'
      const res = await fetch(`${ENDPOINTS[tab]}?${param}=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (!res.ok) {
        const err = new Error(data.error || 'Gagal memproses permintaan.')
        err.detail = data.detail
        throw err
      }
      setResult(data)
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Terjadi kesalahan. Coba lagi.')
      setErrorDetail(err.detail || '')
    }
  }

  const placeholder =
    tab === 'post' ? 'Tempel link postingan atau reels Instagram...' : 'Masukkan username Instagram...'

  const actionLabel = tab === 'post' ? 'Ambil Media' : tab === 'profile' ? 'Ambil Foto Profil' : 'Cek Story'

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col items-center px-6 py-14 sm:py-20 font-sans">
      <div className="flex items-center gap-2.5 mb-6">
        <span className="ig-ring w-9 h-9">
          <span className="w-full h-full rounded-full bg-paper flex items-center justify-center text-[12px] font-bold">
            AG
          </span>
        </span>
        <span className="font-bold text-lg tracking-tight">ArGrams</span>
      </div>

      <h1 className="text-4xl sm:text-5xl font-extrabold text-center tracking-tight max-w-md leading-[1.15]">
        Simpan apa saja dari Instagram
      </h1>
      <p className="mt-3 text-muted text-center max-w-sm text-[15px]">
        Postingan, reels, foto profil — tempel link atau username-nya.
      </p>

      <div className="mt-9 flex gap-1 bg-white border border-line rounded-full p-1 flex-wrap justify-center">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchTab(t.id)}
            className={`px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors ${
              tab === t.id ? 'ig-gradient text-white' : 'text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 w-full max-w-md bg-white border border-line rounded-2xl shadow-sm p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-[14px] outline-none focus:border-ink/30 transition-colors placeholder:text-muted"
          />

          {status === 'error' && (
            <div className="px-1">
              <p className="text-sm text-[#ED4956]">{error}</p>
              {errorDetail && (
                <p className="text-[11px] text-muted mt-1 font-mono break-all">{errorDetail}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full ig-gradient text-white font-semibold text-[15px] rounded-xl py-3 hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              actionLabel
            )}
          </button>
        </form>

        {status === 'done' && result && tab === 'post' && (
          <div className="mt-5 pt-5 border-t border-line space-y-2.5">
            {result.type === 'video' && result.video && (
              <>
                <video
                  src={result.video}
                  poster={result.images?.[0]}
                  controls
                  className="w-full rounded-xl bg-black max-h-72 object-contain"
                />
                <a
                  href={proxied(result.video, `argrams-${result.shortcode}.mp4`)}
                  download
                  className="flex items-center justify-between ig-gradient text-white rounded-xl px-4 py-3 text-[14px] font-semibold"
                >
                  Download Video
                  <span className="material-symbols-rounded text-[18px]">download</span>
                </a>
              </>
            )}

            {result.type === 'image' && result.images?.length > 0 && (
              <>
                <div className={`grid gap-1.5 ${result.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {result.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Media ${i + 1}`}
                      className="w-full rounded-xl object-cover aspect-square bg-paper"
                    />
                  ))}
                </div>
                {result.images.map((img, i) => (
                  <a
                    key={i}
                    href={proxied(img, `argrams-${result.shortcode}-${i + 1}.jpg`)}
                    download
                    className="flex items-center justify-between border border-line rounded-xl px-4 py-3 text-[14px] font-medium hover:bg-paper transition-colors"
                  >
                    {result.images.length > 1 ? `Download Foto ${i + 1}` : 'Download Foto'}
                    <span className="material-symbols-rounded text-[18px]">download</span>
                  </a>
                ))}
              </>
            )}

            {result.note && <p className="text-[12px] text-muted px-1">{result.note}</p>}
          </div>
        )}

        {status === 'done' && result && tab === 'profile' && (
          <div className="mt-5 pt-5 border-t border-line flex flex-col items-center text-center">
            <span className="ig-ring w-24 h-24">
              <img
                src={result.profilePic}
                alt={result.username}
                className="w-full h-full rounded-full object-cover border-2 border-white"
              />
            </span>
            <p className="mt-3 font-semibold text-[15px]">@{result.username}</p>
            {result.fullName && <p className="text-[13px] text-muted">{result.fullName}</p>}
            <a
              href={proxied(result.profilePic, `argrams-${sanitizeFilename(result.username)}-profile.jpg`)}
              download
              className="mt-4 w-full flex items-center justify-center gap-2 ig-gradient text-white rounded-xl px-4 py-3 text-[14px] font-semibold"
            >
              Download Foto Profil
              <span className="material-symbols-rounded text-[18px]">download</span>
            </a>
          </div>
        )}

        {status === 'done' && result && tab === 'story' && (
          <div className="mt-5 pt-5 border-t border-line text-center">
            <span className="material-symbols-rounded text-3xl text-muted">lock</span>
            <p className="mt-2 text-[14px] text-ink font-medium">Story tidak tersedia lewat cara publik</p>
            <p className="mt-1 text-[13px] text-muted">{result.message}</p>
          </div>
        )}
      </div>

      <p className="mt-10 text-[12px] text-muted text-center max-w-xs">
        Gunakan untuk konten milik sendiri atau dengan izin pembuatnya.
      </p>
    </div>
  )
}
