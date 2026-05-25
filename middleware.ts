import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === '/sign-in') return NextResponse.next()
  if (pathname.startsWith('/api/')) return NextResponse.next()

  const auth = req.cookies.get('auth')?.value
  if (auth !== 'true') {
    const url = req.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp).*)'],
}
