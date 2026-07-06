export function handleLogout(onLogout: () => void) {
  localStorage.removeItem('fidscript_client_token');
  onLogout();
}
