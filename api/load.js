const OWNER = 'Chang-Shih-Yung'
const REPO = 'About-Henry'
const ALLOWED = ['Intro.md', 'QA.md', 'About.md']

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
  }

  const { filename } = req.query
  if (!ALLOWED.includes(filename)) {
    return res.status(400).json({ ok: false, error: 'Invalid filename' })
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filename}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }
    )

    if (!response.ok) {
      return res.status(200).json({ ok: true, content: '' })
    }

    const data = await response.json()
    const content = Buffer.from(data.content, 'base64').toString('utf-8')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ ok: true, content })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
}
