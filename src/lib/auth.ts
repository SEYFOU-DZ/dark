function safeJsonParse(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getCookieValue(name: string) {
  if (typeof window === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token') || getCookieValue('token');
  const user = safeJsonParse(localStorage.getItem('user')) || safeJsonParse(getCookieValue('user'));
  return !!token && !!user;
}

export function isAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  const user = safeJsonParse(localStorage.getItem('user')) || safeJsonParse(getCookieValue('user'));
  return user?.isAdmin === true;
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  return (
    safeJsonParse(localStorage.getItem('user')) ||
    safeJsonParse(getCookieValue('user'))
  );
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function logout() {
  if (typeof window === 'undefined') return;
  const Cookies = require('js-cookie');
  Cookies.remove('token');
  Cookies.remove('user');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function setAuth(token: string, user: any) {
  if (typeof window === 'undefined') return;
  const Cookies = require('js-cookie');
  Cookies.set('token', token, { expires: 7 });
  Cookies.set('user', JSON.stringify(user), { expires: 7 });
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
