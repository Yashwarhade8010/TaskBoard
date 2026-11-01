// Relative URL: Vite proxies /api in dev, nginx proxies it in containers/Kubernetes.
const BASE = '/api/tasks';

async function request(path = '', options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body.details?.map((d) => `${d.path.join('.')}: ${d.message}`).join('; ');
    throw new Error(detail || body.error || `Request failed (${res.status})`);
  }
  return body;
}

export const listTasks = (status) => request(status ? `?status=${status}` : '').then((r) => r.data);
export const createTask = (task) => request('', { method: 'POST', body: JSON.stringify(task) });
export const updateTask = (id, patch) => request(`/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
export const deleteTask = (id) => request(`/${id}`, { method: 'DELETE' });
