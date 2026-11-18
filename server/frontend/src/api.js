export async function apiGet(path) {
  const response = await fetch(`/djangoapp${path}`, { credentials: 'include' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

export async function apiPost(path, body) {
  const response = await fetch(`/djangoapp${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

export async function getLoggedInUser() {
  try {
    const data = await apiGet('/get_user');
    return data.userName || '';
  } catch {
    return '';
  }
}
