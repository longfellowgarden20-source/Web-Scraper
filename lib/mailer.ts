// Edge-compatible mailer using Gmail SMTP via fetch (nodemailer removed — not edge compatible)

interface MailOptions {
  from: string
  to: string | undefined
  subject: string
  html: string
}

export async function sendMail(options: MailOptions): Promise<void> {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD

  if (!user || !pass) {
    console.warn('GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping email')
    return
  }

  // Use Gmail API via fetch with basic auth encoded as base64
  const credentials = btoa(`${user}:${pass}`)

  // Build RFC 2822 email
  const email = [
    `From: ${options.from}`,
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    options.html,
  ].join('\r\n')

  const encoded = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encoded }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Email send failed:', err)
  }
}

// Backwards compat shim so existing routes don't need changes
export const transporter = {
  sendMail,
}
