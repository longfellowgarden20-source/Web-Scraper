import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { transporter } from '@/lib/mailer'

export const runtime = 'edge'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get leads from the last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: leads, error } = await getSupabaseAdmin()
    .from('leads')
    .select('*')
    .gte('created_at', since)
    .order('score', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!leads?.length) return NextResponse.json({ ok: true, message: 'No new leads, skipping digest' })

  const newCount = leads.length
  const noWebsite = leads.filter(l => !l.website).length
  const highScore = leads.filter(l => l.score >= 8).length
  const withEmail = leads.filter(l => l.email).length
  const mapsCount = leads.filter(l => l.source === 'google_maps').length
  const redditCount = leads.filter(l => l.source === 'reddit').length

  const topLeads = leads.slice(0, 10)

  const leadRows = topLeads.map(l => `
    <tr style="border-bottom: 1px solid #1e293b;">
      <td style="padding: 10px 12px; color: #f1f5f9; font-size: 13px;">${l.business_name}</td>
      <td style="padding: 10px 12px; color: #94a3b8; font-size: 13px;">${l.city || '—'}</td>
      <td style="padding: 10px 12px; font-size: 13px;">
        <span style="background: ${l.score >= 8 ? '#7f1d1d' : l.score >= 5 ? '#713f12' : '#1e293b'}; color: ${l.score >= 8 ? '#fca5a5' : l.score >= 5 ? '#fde68a' : '#94a3b8'}; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">
          ${l.score}/10
        </span>
      </td>
      <td style="padding: 10px 12px; color: #94a3b8; font-size: 13px;">${l.email ?? '—'}</td>
      <td style="padding: 10px 12px; font-size: 13px;">
        ${l.website
          ? `<a href="${l.website}" style="color: #38bdf8; text-decoration: none; font-size: 12px;">${l.website.replace(/^https?:\/\//, '').slice(0, 30)}</a>`
          : '<span style="color: #ef4444; font-size: 12px;">No website</span>'
        }
      </td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background: #0a0f1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">

        <!-- Header -->
        <div style="margin-bottom: 24px;">
          <h1 style="color: #0ea5e9; font-size: 20px; margin: 0 0 4px;">Fast Websites</h1>
          <p style="color: #475569; font-size: 13px; margin: 0;">Daily Lead Digest — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        <!-- Stats -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
          ${[
            { label: 'New Leads', value: newCount, color: '#0ea5e9' },
            { label: 'Score 8-10', value: highScore, color: '#ef4444' },
            { label: 'Have Email', value: withEmail, color: '#22c55e' },
            { label: 'No Website', value: noWebsite, color: '#f59e0b' },
            { label: 'From Maps', value: mapsCount, color: '#a855f7' },
            { label: 'From Reddit', value: redditCount, color: '#f59e0b' },
          ].map(s => `
            <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 14px 16px;">
              <p style="color: #475569; font-size: 11px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.05em;">${s.label}</p>
              <p style="color: ${s.color}; font-size: 24px; font-weight: 700; margin: 0;">${s.value}</p>
            </div>
          `).join('')}
        </div>

        <!-- Top leads table -->
        <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
          <div style="padding: 14px 16px; border-bottom: 1px solid #1e293b;">
            <p style="color: #f1f5f9; font-size: 14px; font-weight: 600; margin: 0;">Top Leads Today</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #1e293b;">
                <th style="padding: 8px 12px; text-align: left; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Business</th>
                <th style="padding: 8px 12px; text-align: left; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">City</th>
                <th style="padding: 8px 12px; text-align: left; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Score</th>
                <th style="padding: 8px 12px; text-align: left; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Email</th>
                <th style="padding: 8px 12px; text-align: left; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Website</th>
              </tr>
            </thead>
            <tbody>
              ${leadRows}
            </tbody>
          </table>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://your-app.vercel.app'}/dashboard"
            style="display: inline-block; background: #0ea5e9; color: #000; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
            Open Dashboard →
          </a>
        </div>

        <p style="color: #1e293b; font-size: 11px; text-align: center;">Fast Websites Lead Scraper · Daily digest</p>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: `Fast Websites <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: `🔥 ${newCount} new leads today — ${highScore} high priority`,
    html,
  })

  return NextResponse.json({ ok: true, sent: true, leads: newCount })
}
