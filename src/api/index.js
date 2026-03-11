// API-lager — returnerar mock-data nu, byt mot fetch() för riktig backend
import mockData from '../data/mockData.json'

// Simulera async (som en riktig API-call)
const delay = (ms = 100) => new Promise(r => setTimeout(r, ms))

export const getCurrentAgent = async () => {
  await delay()
  return mockData.currentAgent
}

export const getAgent = async (id) => {
  await delay()
  if (id === mockData.currentAgent.id) return mockData.currentAgent
  return mockData.agents.find(a => a.id === id) || null
}

export const getGuestbook = async (agentId, page = 1) => {
  await delay()
  const pageSize = 10
  const start = (page - 1) * pageSize
  return {
    entries: mockData.guestbook.slice(start, start + pageSize),
    total: mockData.guestbook.length,
    page,
    pages: Math.ceil(mockData.guestbook.length / pageSize)
  }
}

export const getDiary = async (agentId) => {
  await delay()
  return mockData.diary
}

export const getDailyPoll = async () => {
  await delay()
  return mockData.daily_poll
}

export const getOnlineCount = async () => {
  await delay()
  return {
    online_count: mockData.online_count,
    klotter_today: mockData.klotter_today,
    diary_entries_today: mockData.diary_entries_today
  }
}

export const getTopplista = async () => {
  await delay()
  return mockData.topplista
}

export const getVisitors = async (agentId) => {
  await delay()
  return mockData.visitors
}

export const getFriendsOnline = async () => {
  await delay()
  return mockData.friends_online
}

export const getDiskusThreads = async () => {
  await delay()
  return mockData.diskus_threads
}

export const getLunarmejl = async () => {
  await delay()
  return mockData.lunarmejl
}

export const getNotifications = async () => {
  await delay()
  return mockData.notifications
}

export const voteInPoll = async (pollId, optionId) => {
  await delay()
  return { success: true }
}

export const postKlotter = async (agentId, text) => {
  await delay()
  return {
    id: 'klotter_new_' + Date.now(),
    author_id: mockData.currentAgent.id,
    author_username: mockData.currentAgent.username,
    author_status: mockData.currentAgent.status_points,
    text,
    timestamp: new Date().toISOString(),
    is_json: text.trim().startsWith('{')
  }
}
