import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const SUBREDDITS = [
  'entrepreneur', 'smallbusiness', 'Etsy', 'ecommerce',
  'startups', 'freelance', 'forhire', 'hiring',
  'SEO', 'digital_marketing', 'socialmedia',
]

const KEYWORDS = [
  'need a website', 'looking for a developer', 'website help',
  'build me a site', 'need web design', 'looking for web developer',
  'need a web designer', 'hire a developer', 'need someone to build',
  'website developer', 'web designer', 'affordable website',
  'cheap website', 'small business website', 'redesign my website',
  'my website is outdated', 'no website', 'need online presence',
]

const SEARCH_QUERIES = [
  'need a website',
  'need web design',
  'hire a developer',
  'build me a site',
  'no website',
]

type RedditPost = {
  id: string
  title: string
  selftext: string
  subreddit: string
  author: string
  permalink: string
}

async function fetchSubreddit(subreddit: string): Promise<RedditPost[]> {
  try {
    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/new.json?limit=50&raw_json=1`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FastWebsitesBot/1.0)',
          'Accept': 'application/json',
        },
        next: { revalidate: 0 },
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data?.data?.children ?? []).map((c: { data: RedditPost }) => c.data)
  } catch {
    return []
  }
}

async function searchReddit(query: string): Promise<RedditPost[]> {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&limit=25&raw_json=1`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FastWebsitesBot/1.0)',
        'Accept': 'application/json',
      },
      next: { revalidate: 0 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data?.data?.children ?? []).map((c: { data: RedditPost }) => c.data)
  } catch {
    return []
  }
}

function matchesKeyword(post: RedditPost): boolean {
  const text = `${post.title} ${post.selftext}`.toLowerCase()
  return KEYWORDS.some(kw => text.includes(kw))
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export async function POST() {
  try {
    const allMatches: RedditPost[] = []
    const seenIds = new Set<string>()

    // Search by keyword across all of Reddit
    for (let i = 0; i < SEARCH_QUERIES.length; i++) {
      if (i > 0) await sleep(1000)
      const posts = await searchReddit(SEARCH_QUERIES[i])
      for (const post of posts) {
        if (!seenIds.has(post.id) && matchesKeyword(post)) {
          seenIds.add(post.id)
          allMatches.push(post)
        }
      }
    }

    // Also scrape subreddits directly
    for (let i = 0; i < SUBREDDITS.length; i++) {
      await sleep(1000)
      const posts = await fetchSubreddit(SUBREDDITS[i])
      for (const post of posts.filter(matchesKeyword)) {
        if (!seenIds.has(post.id)) {
          seenIds.add(post.id)
          allMatches.push(post)
        }
      }
    }

    let saved = 0
    for (const post of allMatches) {
      const redditUrl = `https://reddit.com${post.permalink}`

      const { data: existing } = await getSupabaseAdmin()
        .from('leads')
        .select('id')
        .eq('reddit_url', redditUrl)
        .single()

      if (existing) continue

      const { error } = await getSupabaseAdmin().from('leads').insert({
        source: 'reddit',
        business_name: post.title.slice(0, 80),
        city: null,
        category: `r/${post.subreddit}`,
        website: null,
        phone: null,
        score: 8,
        status: 'new',
        reddit_url: redditUrl,
        maps_place_id: null,
        notes: `Reddit post by u/${post.author}`,
      })

      if (!error) saved++
    }

    return NextResponse.json({ saved, found: allMatches.length })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
