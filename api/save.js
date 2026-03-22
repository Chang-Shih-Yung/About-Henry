const OWNER = 'Chang-Shih-Yung'
const REPO = 'About-Henry'
const ALLOWED = ['content/henry/Intro.md', 'content/QA.md', 'content/About.md', 'content/Data.md', 'content/Nexus.md', 'content/Focus.md']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
  }

  const { filename, content } = req.body
  if (!ALLOWED.includes(filename)) {
    return res.status(400).json({ ok: false, error: 'Invalid filename' })
  }

  const headers = {
    Authorization: `Bearer ${process.env.GH_PAT}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }

  try {
    // Get current SHA (required for updating existing file)
    const getRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filename}`,
      { headers }
    )
    const sha = getRes.ok ? (await getRes.json()).sha : undefined

    // Commit updated content
    const putRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filename}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `update ${filename}`,
          content: Buffer.from(content, 'utf-8').toString('base64'),
          ...(sha && { sha }),
        }),
      }
    )

    if (!putRes.ok) {
      const err = await putRes.json()
      return res.status(500).json({ ok: false, error: err.message })
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
}
