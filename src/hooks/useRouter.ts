import { useState, useEffect, useCallback } from 'react';

export type AppRoute = 'home' | 'about';

export const APP_ROUTES = {
  HOME: 'home',
  ABOUT: 'about',
} as const;

export function normalizePath(pathname: string, baseUrl = import.meta.env.BASE_URL): string {
  const cleanBase = (baseUrl || '/').replace(/\/+$/, '');
  let relative = pathname;
  if (cleanBase && relative.startsWith(cleanBase)) {
    relative = relative.slice(cleanBase.length);
  }
  return relative.replace(/^\/+|\/+$/g, '').toLowerCase();
}

export function parseRoute(pathname: string, baseUrl = import.meta.env.BASE_URL): AppRoute {
  const relative = normalizePath(pathname, baseUrl);
  return relative === 'about' ? 'about' : 'home';
}

export function getPathForRoute(route: AppRoute, baseUrl = import.meta.env.BASE_URL): string {
  const cleanBase = (baseUrl || '/').replace(/\/+$/, '');
  if (route === 'about') {
    return cleanBase ? `${cleanBase}/about` : '/about';
  }
  return cleanBase ? `${cleanBase}/` : '/';
}

function handleInitialRedirect(baseUrl = import.meta.env.BASE_URL): AppRoute {
  if (typeof window === 'undefined') return 'home';

  // Handle SPA 404 query redirect (e.g. from GitHub Pages 404.html: ?/about or ?%2Fabout)
  const search = window.location.search;
  if (search && search.startsWith('?')) {
    const rawQuery = search.slice(1).split('&')[0];
    const decoded = decodeURIComponent(rawQuery);
    if (decoded.startsWith('/')) {
      const cleanBase = (baseUrl || '/').replace(/\/+$/, '');
      const fullPath = (cleanBase + decoded).replace(/\/+/g, '/');
      window.history.replaceState(null, '', fullPath);
      return parseRoute(decoded, '/');
    }
  }

  return parseRoute(window.location.pathname, baseUrl);
}

export function useRouter() {
  const [route, setRoute] = useState<AppRoute>(() => handleInitialRedirect());

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = useCallback((targetRoute: AppRoute) => {
    const targetPath = getPathForRoute(targetRoute);
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    setRoute(targetRoute);
  }, []);

  const navigateToAbout = useCallback(() => {
    navigate('about');
  }, [navigate]);

  const navigateToHome = useCallback(() => {
    navigate('home');
  }, [navigate]);

  return {
    route,
    isAbout: route === 'about',
    isHome: route === 'home',
    navigate,
    navigateToAbout,
    navigateToHome,
  };
}
