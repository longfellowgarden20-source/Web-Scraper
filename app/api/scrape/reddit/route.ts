import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
      `https://www.reddit.com/r/${subreddit}/new.json?limit=50`,
      {
        headers: { 'User-Agent': 'FastWebsitesBot/1.0' },
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

    for (let i = 0; i < SUBREDDITS.length; i++) {
      if (i > 0) await sleep(1000)
      const posts = await fetchSubreddit(SUBREDDITS[i])
      const matched = posts.filter(matchesKeyword)
      allMatches.push(...matched)
    }

    let saved = 0
    for (const post of allMatches) {
      const redditUrl = `https://reddit.com${post.permalink}`

      const { data: existing } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('reddit_url', redditUrl)
        .single()

      if (existing) continue

      const { error } = await supabaseAdmin.from('leads').insert({
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
