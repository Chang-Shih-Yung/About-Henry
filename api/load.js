const OWNER = 'Chang-Shih-Yung'
const REPO = 'About-Henry'
const ALLOWED = ['content/henry/Intro.md', 'content/guest/Intro.md', 'content/QA.md', 'content/About.md', 'content/Data.md', 'content/Nexus.md', 'content/Focus.md', 'content/MES.md', 'content/Presentation.md']

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
  }

  const { filename } = req.query
  if (!ALLOWED.includes(filename)) {
    return res.status(400).json({ ok: false, error: 'Invalid filename' })
  }

  const pat = process.env.GH_PAT
  console.log('GH_PAT set:', !!pat, 'length:', pat?.length)

  try {
    const response = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filename}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GH_PAT}`,
          Accept: 'application/vnd.github+json',
        },
      }
    )

    if (!response.ok) {
      const errBody = await response.text()
      console.error(`GitHub API error: ${response.status} ${errBody}`)
      return res.status(200).json({ ok: true, content: '', debug: `${response.status}: ${errBody}` })
    }

    const data = await response.json()
    const content = Buffer.from(data.content, 'base64').toString('utf-8')
    return res.status(200).json({ ok: true, content })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
}
