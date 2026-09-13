const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  getCatalog: () => fetch(`${API_BASE}/catalog`).then(handle),

  getPapers: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== "" && v != null)
    ).toString();
    return fetch(`${API_BASE}/papers${query ? `?${query}` : ""}`).then(handle);
  },

  getSubjects: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== "" && v != null)
    ).toString();
    return fetch(`${API_BASE}/papers/subjects${query ? `?${query}` : ""}`).then(handle);
  },

  uploadPaper: (formData) =>
    fetch(`${API_BASE}/papers`, { method: "POST", body: formData }).then(handle),

  viewUrl: (id, index = 0) => `${API_BASE}/papers/${id}/view${index ? `?index=${index}` : ""}`,
  downloadUrl: (id, index = 0) => `${API_BASE}/papers/${id}/download${index ? `?index=${index}` : ""}`,

  upvote: (id) => fetch(`${API_BASE}/papers/${id}/upvote`, { method: "PATCH" }).then(handle),

  adminLogin: (password) =>
    fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).then(handle),

  adminGetPapers: (token, status = "pending") =>
    fetch(`${API_BASE}/admin/papers?status=${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(handle),

  adminSetStatus: (token, id, status) =>
    fetch(`${API_BASE}/admin/papers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }).then(handle),

  adminDelete: (token, id) =>
    fetch(`${API_BASE}/admin/papers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).then(handle),
};
