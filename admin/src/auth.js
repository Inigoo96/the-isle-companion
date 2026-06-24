export function getToken()       { return localStorage.getItem('isle_admin_token'); }
export function getUser()        { return JSON.parse(localStorage.getItem('isle_admin_user') || 'null'); }
export function isAuthenticated(){ return !!getToken(); }

export function saveAuth(token, user) {
  localStorage.setItem('isle_admin_token', token);
  localStorage.setItem('isle_admin_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('isle_admin_token');
  localStorage.removeItem('isle_admin_user');
}
