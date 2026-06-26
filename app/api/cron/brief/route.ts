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

  const today = new Date().toISOString().split('T')[0]
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://your-app.vercel.app'
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const [leadsRes, followUpsRes, projectsRes, invoicesRes, hotLeadsRes] = await Promise.all([
    getSupabaseAdmin().from('leads').select('id, business_name, city, score, email, source').gte('created_at', since24h).order('score', { ascending: false }).limit(10),
    getSupabaseAdmin().from('leads').select('id, business_name, city, follow_up_date').lte('follow_up_date', today).not('follow_up_date', 'is', null).neq('status', 'converted').neq('status', 'passed'),
    getSupabaseAdmin().from('projects').select('id, client_name, status, deadline, price').eq('status', 'in_progress').order('deadline', { ascending: true }).limit(10),
    getSupabaseAdmin().from('invoices').select('id, client_name, amount, due_date').eq('paid', false).lte('due_date', today).order('due_date', { ascending: true }),
    getSupabaseAdmin().from('leads').select('id, business_name, city, score, email').eq('status', 'new').gte('score', 8).lte('created_at', since48h).order('score', { ascending: false }).limit(5),
  ])

  const newLeads = leadsRes.data ?? []
  const followUps = followUpsRes.data ?? []
  const activeProjects = projectsRes.data ?? []
  const overdueInvoices = invoicesRes.data ?? []
  const hotUncontacted = hotLeadsRes.data ?? []

  const overdueTotal = overdueInvoices.reduce((s, i) => s + (i.amount ?? 0), 0)

  const leadsHtml = newLeads.length === 0
    ? '<p style="color:#475569;font-size:13px;margin:0;">No new leads in the last 24 hours.</p>'
    : newLeads.map(l => `
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:8px 12px;color:#f1f5f9;font-size:13px;font-family:-apple-system,Arial,sans-serif;">${l.business_name}</td>
        <td style="padding:8px 12px;color:#64748b;font-size:12px;font-family:-apple-system,Arial,sans-serif;">${l.city || '—'}</td>
        <td style="padding:8px 12px;font-family:-apple-system,Arial,sans-serif;">
          <span style="background:${l.score >= 8 ? '#450a0a' : '#1e293b'};color:${l.score >= 8 ? '#fca5a5' : '#64748b'};padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;">${l.score}/10</span>
        </td>
        <td style="padding:8px 12px;color:${l.email ? '#38bdf8' : '#334155'};font-size:12px;font-family:-apple-system,Arial,sans-serif;">${l.email ?? '—'}</td>
      </tr>`).join('')

  const followUpHtml = followUps.length === 0
    ? '<p style="color:#475569;font-size:13px;margin:0;">No follow-ups due today.</p>'
    : followUps.map(f => `
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:8px 12px;color:#f1f5f9;font-size:13px;font-family:-apple-system,Arial,sans-serif;">${f.business_name}</td>
        <td style="padding:8px 12px;color:#64748b;font-size:12px;font-family:-apple-system,Arial,sans-serif;">${f.city || '—'}</td>
        <td style="padding:8px 12px;color:#fde68a;font-size:12px;font-family:-apple-system,Arial,sans-serif;">${f.follow_up_date}</td>
      </tr>`).join('')

  const projectHtml = activeProjects.length === 0
    ? '<p style="color:#475569;font-size:13px;margin:0;">No active projects.</p>'
    : activeProjects.map(p => `
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:8px 12px;color:#f1f5f9;font-size:13px;font-family:-apple-system,Arial,sans-serif;">${p.client_name}</td>
        <td style="padding:8px 12px;color:#64748b;font-size:12px;font-family:-apple-system,Arial,sans-serif;">${p.price ? `$${p.price.toLocaleString()}` : '—'}</td>
        <td style="padding:8px 12px;color:${p.deadline && p.deadline <= today ? '#fca5a5' : '#64748b'};font-size:12px;font-family:-apple-system,Arial,sans-serif;">${p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}</td>
      </tr>`).join('')

  const invoiceHtml = overdueInvoices.length === 0
    ? '<p style="color:#475569;font-size:13px;margin:0;">No overdue invoices.</p>'
    : overdueInvoices.map(i => `
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:8px 12px;color:#f1f5f9;font-size:13px;font-family:-apple-system,Arial,sans-serif;">${i.client_name}</td>
        <td style="padding:8px 12px;color:#fca5a5;font-size:13px;font-weight:700;font-family:-apple-system,Arial,sans-serif;">$${i.amount.toLocaleString()}</td>
        <td style="padding:8px 12px;color:#ef4444;font-size:12px;font-family:-apple-system,Arial,sans-serif;">${i.due_date ? new Date(i.due_date).toLocaleDateString() : '—'}</td>
      </tr>`).join('')

  const sectionStyle = 'background:#0f172a;border:1px solid #1e293b;border-radius:12px;overflow:hidden;margin-bottom:20px;'
  const headerStyle = 'padding:12px 16px;border-bottom:1px solid #1e293b;'
  const tableStyle = 'width:100%;border-collapse:collapse;'

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#060b14;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#060b14;">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td style="padding-bottom:24px;border-bottom:1px solid #1e293b;">
        <p style="margin:0;color:#0ea5e9;font-size:22px;font-weight:800;font-family:-apple-system,Arial,sans-serif;">Fast Websites</p>
        <p style="margin:4px 0 0;color:#334155;font-size:12px;font-family:-apple-system,Arial,sans-serif;">Daily Brief &nbsp;·&nbsp; ${date}</p>
      </td></tr>
      <tr><td style="height:24px;"></td></tr>

      ${overdueInvoices.length > 0 ? `
      <!-- Overdue invoice alert -->
      <tr><td style="background:#450a0a;border:1px solid #7f1d1d;border-radius:12px;padding:14px 16px;">
        <p style="margin:0;color:#fca5a5;font-size:13px;font-weight:700;font-family:-apple-system,Arial,sans-serif;">⚠️ ${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} — $${overdueTotal.toLocaleString()} outstanding</p>
      </td></tr>
      <tr><td style="height:16px;"></td></tr>` : ''}

      ${hotUncontacted.length > 0 ? `
      <!-- Hot leads alert -->
      <tr><td style="background:#1c1408;border:1px solid #78350f;border-radius:12px;padding:14px 16px;">
        <p style="margin:0 0 8px;color:#fbbf24;font-size:13px;font-weight:700;font-family:-apple-system,Arial,sans-serif;">🔥 ${hotUncontacted.length} hot lead${hotUncontacted.length > 1 ? 's' : ''} haven't been contacted in 48h</p>
        ${hotUncontacted.map(l => `<p style="margin:2px 0;color:#d97706;font-size:12px;font-family:-apple-system,Arial,sans-serif;">· ${l.business_name}${l.city ? ` — ${l.city}` : ''} (score: ${l.score}/10)</p>`).join('')}
      </td></tr>
      <tr><td style="height:16px;"></td></tr>` : ''}

      <!-- New Leads -->
      <tr><td style="${sectionStyle}">
        <div style="${headerStyle}"><p style="margin:0;color:#f1f5f9;font-size:13px;font-weight:700;font-family:-apple-system,Arial,sans-serif;">New Leads (24h) <span style="color:#0ea5e9;">${newLeads.length}</span></p></div>
        ${newLeads.length > 0 ? `<table style="${tableStyle}">${leadsHtml}</table>` : `<div style="padding:14px 16px;">${leadsHtml}</div>`}
      </td></tr>

      <!-- Follow-ups -->
      <tr><td style="${sectionStyle}">
        <div style="${headerStyle}"><p style="margin:0;color:#f1f5f9;font-size:13px;font-weight:700;font-family:-apple-system,Arial,sans-serif;">Follow-ups Due Today <span style="color:#fde68a;">${followUps.length}</span></p></div>
        ${followUps.length > 0 ? `<table style="${tableStyle}">${followUpHtml}</table>` : `<div style="padding:14px 16px;">${followUpHtml}</div>`}
      </td></tr>

      <!-- Active Projects -->
      <tr><td style="${sectionStyle}">
        <div style="${headerStyle}"><p style="margin:0;color:#f1f5f9;font-size:13px;font-weight:700;font-family:-apple-system,Arial,sans-serif;">Active Projects <span style="color:#a855f7;">${activeProjects.length}</span></p></div>
        ${activeProjects.length > 0 ? `<table style="${tableStyle}">${projectHtml}</table>` : `<div style="padding:14px 16px;">${projectHtml}</div>`}
      </td></tr>

      <!-- Overdue Invoices -->
      <tr><td style="${sectionStyle}">
        <div style="${headerStyle}"><p style="margin:0;color:#f1f5f9;font-size:13px;font-weight:700;font-family:-apple-system,Arial,sans-serif;">Overdue Invoices <span style="color:#ef4444;">${overdueInvoices.length}</span></p></div>
        ${overdueInvoices.length > 0 ? `<table style="${tableStyle}">${invoiceHtml}</table>` : `<div style="padding:14px 16px;">${invoiceHtml}</div>`}
      </td></tr>

      <tr><td style="height:24px;"></td></tr>
      <!-- CTA -->
      <tr><td align="center">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="background:#0ea5e9;border-radius:10px;padding:0 4px 0 0;">
            <a href="${appUrl}/dashboard" style="display:inline-block;padding:12px 28px;color:#000;font-size:13px;font-weight:700;text-decoration:none;font-family:-apple-system,Arial,sans-serif;">Open Dashboard</a>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="height:24px;"></td></tr>
      <tr><td align="center"><p style="margin:0;color:#1e293b;font-size:11px;font-family:-apple-system,Arial,sans-serif;">Fast Websites · Daily Brief</p></td></tr>

    </table>
  </td></tr>
</table>
</body></html>`

  const subjectParts = []
  if (hotUncontacted.length > 0) subjectParts.push(`🔥 ${hotUncontacted.length} hot leads waiting`)
  if (newLeads.length > 0) subjectParts.push(`${newLeads.length} new leads`)
  if (followUps.length > 0) subjectParts.push(`${followUps.length} follow-ups due`)
  if (overdueInvoices.length > 0) subjectParts.push(`$${overdueTotal.toLocaleString()} overdue`)

  const subject = subjectParts.length > 0
    ? `Daily Brief — ${subjectParts.join(' · ')}`
    : 'Daily Brief — All clear today'

  await transporter.sendMail({
    from: `Fast Websites <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject,
    html,
  })

  return NextResponse.json({ ok: true, newLeads: newLeads.length, followUps: followUps.length, overdueInvoices: overdueInvoices.length, hotUncontacted: hotUncontacted.length })
}
