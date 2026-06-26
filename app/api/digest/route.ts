import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { transporter } from '@/lib/mailer'

export const runtime = 'edge'

export const dynamic = 'force-dynamic'

export async function POST() {
  const { data: leads, error } = await getSupabaseAdmin()
    .from('leads')
    .select('*')
    .order('score', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!leads?.length) return NextResponse.json({ error: 'No leads yet — run a scrape first' }, { status: 400 })

  const totalCount = leads.length
  const noWebsite = leads.filter(l => !l.website).length
  const highScore = leads.filter(l => l.score >= 8).length
  const withEmail = leads.filter(l => l.email).length
  const mapsCount = leads.filter(l => l.source === 'google_maps').length
  const redditCount = leads.filter(l => l.source === 'reddit').length
  const topLeads = leads.slice(0, 10)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://your-app.vercel.app'
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const stats = [
    { label: 'Total Leads', value: totalCount, color: '#0ea5e9' },
    { label: 'High Priority', value: highScore, color: '#ef4444' },
    { label: 'Have Email', value: withEmail, color: '#22c55e' },
    { label: 'No Website', value: noWebsite, color: '#f59e0b' },
    { label: 'From Maps', value: mapsCount, color: '#a855f7' },
    { label: 'From Reddit', value: redditCount, color: '#38bdf8' },
  ]

  const statRows = [stats.slice(0, 3), stats.slice(3, 6)].map(row => `
    <tr>
      ${row.map(s => `
        <td width="33%" style="padding: 0 6px 12px 6px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px;">
            <tr>
              <td style="padding: 14px 16px;">
                <p style="margin: 0 0 6px 0; color: #475569; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-family: -apple-system, Arial, sans-serif;">${s.label}</p>
                <p style="margin: 0; color: ${s.color}; font-size: 28px; font-weight: 800; font-family: -apple-system, Arial, sans-serif; line-height: 1;">${s.value}</p>
              </td>
            </tr>
          </table>
        </td>
      `).join('')}
    </tr>
  `).join('')

  const leadRows = topLeads.map((l, i) => `
    <tr style="background-color: ${i % 2 === 0 ? '#0a1120' : '#080d18'};">
      <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #f1f5f9; font-size: 13px; font-weight: 600; font-family: -apple-system, Arial, sans-serif;">${l.business_name}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #64748b; font-size: 12px; font-family: -apple-system, Arial, sans-serif;">${l.city || '—'}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b;">
        <span style="background-color: ${l.score >= 8 ? '#450a0a' : l.score >= 5 ? '#422006' : '#0f172a'}; color: ${l.score >= 8 ? '#fca5a5' : l.score >= 5 ? '#fde68a' : '#64748b'}; padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; font-family: -apple-system, Arial, sans-serif;">${l.score}/10</span>
      </td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; font-size: 12px; font-family: -apple-system, Arial, sans-serif;">
        ${l.email ? `<a href="mailto:${l.email}" style="color: #38bdf8; text-decoration: none;">${l.email}</a>` : '<span style="color: #334155;">—</span>'}
      </td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #1e293b; font-size: 12px; font-family: -apple-system, Arial, sans-serif;">
        ${l.website
          ? `<a href="${l.website}" style="color: #38bdf8; text-decoration: none;">${l.website.replace(/^https?:\/\//, '').slice(0, 25)}</a>`
          : '<span style="color: #ef4444; font-weight: 700;">No website</span>'
        }
      </td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fast Websites Lead Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060b14; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #060b14;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <!-- Inner container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 24px; border-bottom: 1px solid #1e293b;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin: 0; color: #0ea5e9; font-size: 24px; font-weight: 800; font-family: -apple-system, Arial, sans-serif; letter-spacing: -0.5px;">Fast Websites</p>
                    <p style="margin: 4px 0 0 0; color: #334155; font-size: 12px; font-family: -apple-system, Arial, sans-serif;">Lead Digest &nbsp;&bull;&nbsp; ${date}</p>
                  </td>
                  <td align="right" valign="middle">
                    <span style="background-color: #0ea5e9; color: #000000; font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 999px; font-family: -apple-system, Arial, sans-serif;">${highScore} HOT LEADS</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height: 24px;"></td></tr>

          <!-- Stats grid -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${statRows}
              </table>
            </td>
          </tr>

          <!-- Top leads table -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #1e293b; border-radius: 16px; overflow: hidden;">
                <!-- Table header -->
                <tr style="background-color: #0f172a;">
                  <td style="padding: 14px 16px; border-bottom: 1px solid #1e293b;" colspan="5">
                    <p style="margin: 0; color: #f1f5f9; font-size: 14px; font-weight: 700; font-family: -apple-system, Arial, sans-serif;">Top Leads by Score</p>
                  </td>
                </tr>
                <!-- Column headers -->
                <tr style="background-color: #080d18;">
                  <td style="padding: 8px 14px; color: #334155; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; font-family: -apple-system, Arial, sans-serif;">Business</td>
                  <td style="padding: 8px 14px; color: #334155; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; font-family: -apple-system, Arial, sans-serif;">City</td>
                  <td style="padding: 8px 14px; color: #334155; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; font-family: -apple-system, Arial, sans-serif;">Score</td>
                  <td style="padding: 8px 14px; color: #334155; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; font-family: -apple-system, Arial, sans-serif;">Email</td>
                  <td style="padding: 8px 14px; color: #334155; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; font-family: -apple-system, Arial, sans-serif;">Website</td>
                </tr>
                ${leadRows}
              </table>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height: 28px;"></td></tr>

          <!-- CTA button -->
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #0ea5e9; border-radius: 10px;">
                    <a href="${appUrl}/dashboard" style="display: inline-block; padding: 14px 36px; color: #000000; font-size: 14px; font-weight: 700; text-decoration: none; font-family: -apple-system, Arial, sans-serif; letter-spacing: -0.2px;">Open Dashboard &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height: 32px;"></td></tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="border-top: 1px solid #0f172a; padding-top: 16px;">
              <p style="margin: 0; color: #1e293b; font-size: 11px; font-family: -apple-system, Arial, sans-serif;">Fast Websites Lead Scraper &nbsp;&bull;&nbsp; fastwebsitesagency.com</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`

  await transporter.sendMail({
    from: `Fast Websites <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: `🔥 ${highScore} hot leads · ${noWebsite} with no website — Fast Websites Digest`,
    html,
  })

  return NextResponse.json({ ok: true })
}
