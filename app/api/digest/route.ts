import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { transporter } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

export async function POST() {
  const { data: leads, error } = await getSupabaseAdmin()
    .from('leads')
    .select('*')
    .order('score', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!leads?.length) return NextResponse.json({ error: 'No leads yet — run a scrape first' }, { status: 400 })

  const newCount = leads.length
  const noWebsite = leads.filter(l => !l.website).length
  const highScore = leads.filter(l => l.score >= 8).length
  const withEmail = leads.filter(l => l.email).length
  const mapsCount = leads.filter(l => l.source === 'google_maps').length
  const redditCount = leads.filter(l => l.source === 'reddit').length
  const topLeads = leads.slice(0, 10)

  const leadRows = topLeads.map(l => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #1e293b;color:#f1f5f9;font-size:13px;font-weight:500;">${l.business_name}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #1e293b;color:#64748b;font-size:12px;">${l.city || '—'}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #1e293b;">
        <span style="background:${l.score >= 8 ? '#450a0a' : l.score >= 5 ? '#422006' : '#0f172a'};color:${l.score >= 8 ? '#fca5a5' : l.score >= 5 ? '#fde68a' : '#64748b'};padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;">${l.score}/10</span>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #1e293b;font-size:12px;">
        ${l.email ? `<a href="mailto:${l.email}" style="color:#38bdf8;text-decoration:none;">${l.email}</a>` : '<span style="color:#334155;">—</span>'}
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #1e293b;font-size:12px;">
        ${l.website
          ? `<a href="${l.website}" style="color:#38bdf8;text-decoration:none;">${l.website.replace(/^https?:\/\//, '').slice(0, 28)}</a>`
          : '<span style="color:#ef4444;font-weight:600;">No website</span>'
        }
      </td>
    </tr>
  `).join('')

  const statCards = [
    { label: 'Total Leads', value: newCount, color: '#0ea5e9' },
    { label: 'High Priority', value: highScore, color: '#ef4444' },
    { label: 'Have Email', value: withEmail, color: '#22c55e' },
    { label: 'No Website', value: noWebsite, color: '#f59e0b' },
    { label: 'From Maps', value: mapsCount, color: '#a855f7' },
    { label: 'From Reddit', value: redditCount, color: '#38bdf8' },
  ].map(s => `
    <td style="width:33%;padding:0 6px 12px;">
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:14px 16px;">
        <div style="color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">${s.label}</div>
        <div style="color:${s.color};font-size:26px;font-weight:800;line-height:1;">${s.value}</div>
      </div>
    </td>
  `).join('')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://your-app.vercel.app'

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060b14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;">
  <div style="max-width:620px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #1e293b;">
      <table style="width:100%;border-collapse:collapse;"><tr>
        <td>
          <div style="color:#0ea5e9;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Fast Websites</div>
          <div style="color:#334155;font-size:12px;margin-top:2px;">Lead Digest · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        </td>
        <td style="text-align:right;">
          <div style="display:inline-block;background:#0ea5e9;color:#000;font-size:11px;font-weight:700;padding:6px 14px;border-radius:999px;">${highScore} HOT LEADS</div>
        </td>
      </tr></table>
    </div>

    <!-- Stats grid -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr>${statCards.slice(0, 3)}</tr>
      <tr>${statCards.slice(3, 6)}</tr>
    </table>

    <!-- Top leads -->
    <div style="background:#0a1120;border:1px solid #1e293b;border-radius:16px;overflow:hidden;margin-bottom:24px;">
      <div style="padding:14px 16px;border-bottom:1px solid #1e293b;background:#0f172a;">
        <span style="color:#f1f5f9;font-size:14px;font-weight:700;">Top Leads by Score</span>
        <span style="color:#334155;font-size:12px;margin-left:8px;">(showing top 10)</span>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#080d18;">
            <th style="padding:8px 14px;text-align:left;color:#334155;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Business</th>
            <th style="padding:8px 14px;text-align:left;color:#334155;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">City</th>
            <th style="padding:8px 14px;text-align:left;color:#334155;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Score</th>
            <th style="padding:8px 14px;text-align:left;color:#334155;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Email</th>
            <th style="padding:8px 14px;text-align:left;color:#334155;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Website</th>
          </tr>
        </thead>
        <tbody>${leadRows}</tbody>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${appUrl}/dashboard" style="display:inline-block;background:#0ea5e9;color:#000000;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:-0.2px;">Open Dashboard →</a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;color:#1e293b;font-size:11px;padding-top:16px;border-top:1px solid #0f172a;">
      Fast Websites Lead Scraper &nbsp;·&nbsp; fastwebsitesagency.com
    </div>

  </div>
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
