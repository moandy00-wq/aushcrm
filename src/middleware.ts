import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() refreshes the token and validates the session
  const { data: { user } } = await supabase.auth.getUser();

  const isDashboardRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/leads') ||
    request.nextUrl.pathname.startsWith('/pipeline') ||
    request.nextUrl.pathname.startsWith('/requests') ||
    request.nextUrl.pathname.startsWith('/team') ||
    request.nextUrl.pathname.startsWith('/settings');

  // Redirect unauthenticated users from dashboard to login
  if (!user && isDashboardRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // For authenticated users on dashboard routes, check for valid role
  if (user && isDashboardRoute) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]));
        const userRole = payload?.user_role;

        if (!userRole || userRole === 'null' || userRole === null) {
          return NextResponse.redirect(new URL('/auth/deactivated', request.url));
        }
      }
    } catch {
      // If JWT parsing fails, let the request through — the layout will handle auth
    }
  }

  // Redirect authenticated users from login to dashboard
  if (user && request.nextUrl.pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
