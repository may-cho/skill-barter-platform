const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  constructor() {
    console.log(API_BASE)
    this.base = API_BASE;
  }

  getToken() {
    return localStorage.getItem('access_token');
  }

  setTokens(access, refresh) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${this.base}${path}`, { ...options, headers });

    if (res.status === 401 && !path.includes('/auth/')) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers.Authorization = `Bearer ${this.getToken()}`;
        return fetch(`${this.base}${path}`, { ...options, headers });
      }
    }

    return res;
  }

  async refreshToken() {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return false;
    const res = await fetch(`${this.base}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) {
      this.clearTokens();
      return false;
    }
    const data = await res.json();
    localStorage.setItem('access_token', data.access);
    return true;
  }

  async json(path, options = {}) {
    const res = await this.request(path, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Request failed: ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  login(username, password) {
    return this.json('/auth/token/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }).then((data) => {
      this.setTokens(data.access, data.refresh);
      return data;
    });
  }

  register(payload) {
    return this.json('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getProfile() {
    return this.json('/auth/me/');
  }

  updateProfile(data) {
    return this.json('/auth/me/', { method: 'PATCH', body: JSON.stringify(data) });
  }

  getMatches() {
    return this.json('/skills/matches/');
  }

  getMySkills() {
    return this.json('/skills/mine/');
  }

  getSkills(params = '') {
    return this.json(`/skills/${params ? '?' + params : ''}`);
  }

  createSkill(data) {
    return this.json('/skills/', { method: 'POST', body: JSON.stringify(data) });
  }

  deleteSkill(id) {
    return this.request(`/skills/${id}/`, { method: 'DELETE' });
  }

  updateSkill(id, data) {
  return this.json(`/skills/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  }

  getProposals() {
    return this.json('/proposals/mine/');
  }

  createProposal(data) {
    return this.json('/proposals/', { method: 'POST', body: JSON.stringify(data) });
  }

  proposalAction(id, action, data = {}) {
    return this.json(`/proposals/${id}/${action}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getMessages(proposalId) {
    return this.json(`/messages/proposal/${proposalId}/`);
  }

  getAppointments() {
    return this.json('/appointments/');
  }

  createAppointment(data) {
    return this.json('/appointments/', { method: 'POST', body: JSON.stringify(data) });
  }

  createReview(data) {
    return this.json('/reviews/', { method: 'POST', body: JSON.stringify(data) });
  }

  getReviews() {
    return this.json('/reviews/');
  }

  updateAdminUser(id, data) {
    return this.json(`/admin/users/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  updateAdminProposal(id, data) {
    return this.json(`/admin/proposals/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  updateAdminSkill(id, data) {
    return this.json(`/admin/skills/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  deleteAdminSkill(id) {
    return this.request(`/admin/skills/${id}/`, { method: 'DELETE' });
  }

  getDashboardStats() {
    return this.json('/admin/dashboard-stats/');
  }


  getCalendarEvents() {
    return this.json('/calendar-events/')
  }
}

export const api = new ApiClient();

export function formatInTimezone(isoString, timezone) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone || 'UTC',
    }).format(new Date(isoString));
  } catch {
    return new Date(isoString).toLocaleString();
  }
}

export const STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Negotiating: 'bg-blue-100 text-blue-800',
  Accepted: 'bg-green-100 text-green-800',
  Completed: 'bg-slate-100 text-slate-800',
  Canceled: 'bg-red-100 text-red-800',
};

export const CATEGORIES = [
  'Programming', 'Languages', 'Music', 'Health & Fitness', 'Arts', 'Business', 'Other',
];

export const LEVELS = ['Beginner', 'Intermediate', 'Expert'];

export const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo',
  'Asia/Kolkata', 'Australia/Sydney', "Asia/Yangon",
];
