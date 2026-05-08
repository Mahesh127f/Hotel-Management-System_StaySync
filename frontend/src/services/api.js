import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  me: () => api.get('/api/auth/me'),
}

// Rooms
export const roomsAPI = {
  getAll: (params) => api.get('/api/rooms', { params }),
  getOne: (id) => api.get(`/api/rooms/${id}`),
  create: (data) => api.post('/api/rooms', data),
  update: (id, data) => api.put(`/api/rooms/${id}`, data),
  delete: (id) => api.delete(`/api/rooms/${id}`),
  checkAvailability: (id, params) => api.get(`/api/rooms/${id}/availability`, { params }),
}

// Bookings
export const bookingsAPI = {
  getAll: () => api.get('/api/bookings'),
  getOne: (id) => api.get(`/api/bookings/${id}`),
  create: (data) => api.post('/api/bookings', data),
  update: (id, data) => api.put(`/api/bookings/${id}`, data),
  cancel: (id) => api.delete(`/api/bookings/${id}`),
}

// Payments
export const paymentsAPI = {
  createOrder: (bookingId) => api.post(`/api/payments/create-order?booking_id=${bookingId}`),
  verify: (data) => api.post('/api/payments/verify', data),
  getByBooking: (bookingId) => api.get(`/api/payments/booking/${bookingId}`),
  getInvoice: (bookingId) => `${API_URL}/api/payments/${bookingId}/invoice`,
}

// Analytics
export const analyticsAPI = {
  getSummary: () => api.get('/api/analytics/summary'),
  getRevenue: (period) => api.get('/api/analytics/revenue', { params: { period } }),
  getBookingsByStatus: () => api.get('/api/analytics/bookings-by-status'),
  getRoomsOccupancy: () => api.get('/api/analytics/rooms-occupancy'),
  getTopRooms: () => api.get('/api/analytics/top-rooms'),
  getCustomerStats: () => api.get('/api/analytics/customer-stats'),
}

// Staff
export const staffAPI = {
  getTasks: () => api.get('/api/staff/tasks'),
  createTask: (data) => api.post('/api/staff/tasks', data),
  updateTask: (id, data) => api.put(`/api/staff/tasks/${id}`, data),
  getMembers: () => api.get('/api/staff/members'),
}

// Reviews
export const reviewsAPI = {
  getRoomReviews: (roomId) => api.get(`/api/reviews/room/${roomId}`),
  getAll: () => api.get('/api/reviews'),
  create: (data) => api.post('/api/reviews', data),
  respond: (id, response) => api.put(`/api/reviews/${id}/respond?response=${encodeURIComponent(response)}`),
  hide: (id) => api.delete(`/api/reviews/${id}`),
}

// Users
export const usersAPI = {
  getAll: () => api.get('/api/users'),
  getOne: (id) => api.get(`/api/users/${id}`),
  updateProfile: (data) => api.put('/api/users/me', data),
  toggleActive: (id) => api.put(`/api/users/${id}/toggle-active`),
  getRecommendations: (id) => api.get(`/api/users/recommendations/${id}`),
}

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/api/notifications'),
  markRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllRead: () => api.put('/api/notifications/read-all'),
}

// Chatbot
export const chatbotAPI = {
  chat: (data) => api.post('/api/chatbot/chat', data),
}

export default api
