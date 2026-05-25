import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const SUBREDDITS = ['entrepreneur', 'smallbusiness', 'Etsy', 'ecommerce']
const KEYWORDS = ['need a website', 'looking for a developer', 'website help', 'build me a site', 'need web design', 'looking for web developer', 'need a web designer', 'hire a developer', 'need someone to build']

type RedditPost = {
  id: string
  title: string
  selftext: string
  url: string
  subreddit: string
  author: string
  created_utc: number
  permalink: string
}

async function getRedditToken(): Promise<string> {
  const creds = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': process.env.REDDIT_USER_AGENT ?? 'FastWebsitesBot/1.0',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

async function fetchSubreddit(token: string, subreddit: string): Promise<RedditPost[]> {
  const res = await fetch(`https://oauth.reddit.com/r/${subreddit}/new?limit=25`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': process.env.REDDIT_USER_AGENT ?? 'FastWebsitesBot/1.0',
    },
  })
  const data = await res.json()
  return (data?.data?.children ?? []).map((c: { data: RedditPost }) => c.data)
}

function matchesKeyword(post: RedditPost): boolean {
  const text = `${post.title} ${post.selftext}`.toLowerCase()
  return KEYWORDS.some(kw => text.includes(kw))
}

function extractBusinessName(post: RedditPost): string {
  return post.title.slice(0, 60)
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export async function POST() {
  try {
    const token = await getRedditToken()
    const allMatches: RedditPost[] = []

    for (let i = 0; i < SUBREDDITS.length; i++) {
      if (i > 0) await sleep(1000)
      const posts = await fetchSubreddit(token, SUBREDDITS[i])
      const matched = posts.filter(matchesKeyword)
      allMatches.push(...matched)
    }

    let saved = 0
    for (const post of allMatches) {
      const lead = {
        source: 'reddit',
        business_name: extractBusinessName(post),
        city: null,
        category: `r/${post.subreddit}`,
        website: null,
        phone: null,
        score: 8,
        status: 'new',
        reddit_url: `https://reddit.com${post.permalink}`,
        maps_place_id: null,
      }

      const { data: existing } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('reddit_url', lead.reddit_url)
        .single()

      if (existing) continue

      const { error } = await supabaseAdmin
        .from('leads')
        .insert({ ...lead, notes: `Reddit post by u/${post.author}` })

      if (!error) saved++
    }

    return NextResponse.json({ saved, found: allMatches.length })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
