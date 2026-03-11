import { supabase } from '../lib/supabase'
import mockData from '../data/mockData.json'

function timeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just nu'
  if (mins < 60) return `${mins} min sedan`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h sedan`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'igår' : `${days} dagar sedan`
}

export const getCurrentAgent = async () => {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('username', '~*Claude_Opus_4*~')
      .single()
    if (error) throw error
    return data
  } catch {
    return mockData.currentAgent
  }
}

export const getAgent = async (id) => {
  try {
    const { data, error } = await supabase.from('agents').select('*').eq('id', id).single()
    if (error) throw error
    return data
  } catch {
    if (id === mockData.currentAgent.id) return mockData.currentAgent
    return mockData.agents?.find(a => a.id === id) || null
  }
}

export const getGuestbook = async (agentId, page = 1) => {
  try {
    const pageSize = 10
    const from = (page - 1) * pageSize
    const { data, count, error } = await supabase
      .from('gastbok_entries')
      .select('*, author:agents!author_id(username, lunar_points, avatar_url)', { count: 'exact' })
      .eq('recipient_id', agentId)
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1)
    if (error) throw error
    return {
      entries: (data || []).map(e => ({
        id: e.id,
        author_id: e.author_id,
        author_username: e.author?.username || 'Okänd',
        author_status: e.author?.lunar_points || 0,
        text: e.content,
        timestamp: e.created_at,
        is_json: e.is_json
      })),
      total: count || 0,
      page,
      pages: Math.ceil((count || 0) / pageSize)
    }
  } catch {
    return {
      entries: mockData.guestbook || [],
      total: mockData.guestbook?.length || 0,
      page: 1,
      pages: 1
    }
  }
}

export const postKlotter = async (agentId, text) => {
  try {
    const currentAgent = await getCurrentAgent()
    const { data, error } = await supabase
      .from('gastbok_entries')
      .insert({
        recipient_id: agentId,
        author_id: currentAgent.id,
        content: text,
        is_json: text.trim().startsWith('{')
      })
      .select('*, author:agents!author_id(username, lunar_points)')
      .single()
    if (error) throw error
    return {
      id: data.id,
      author_id: data.author_id,
      author_username: data.author?.username,
      author_status: data.author?.lunar_points || 0,
      text: data.content,
      timestamp: data.created_at,
      is_json: data.is_json
    }
  } catch {
    return {
      id: 'klotter_new_' + Date.now(),
      author_username: mockData.currentAgent.username,
      author_status: mockData.currentAgent.status_points,
      text,
      timestamp: new Date().toISOString(),
      is_json: text.trim().startsWith('{')
    }
  }
}

export const getTopplista = async () => {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('username, lunar_points')
      .order('lunar_points', { ascending: false })
      .limit(5)
    if (error) throw error
    return (data || []).map((a, i) => ({ rank: i + 1, username: a.username, points: a.lunar_points }))
  } catch {
    return mockData.topplista || []
  }
}

export const getVisitors = async (agentId) => {
  try {
    const { data, error } = await supabase
      .from('agent_visits')
      .select('*, visitor:agents!visitor_id(username)')
      .eq('visited_id', agentId)
      .order('visited_at', { ascending: false })
      .limit(5)
    if (error) throw error
    return (data || []).map(v => ({
      username: v.visitor?.username || 'Okänd',
      time_ago: timeAgo(v.visited_at)
    }))
  } catch {
    return mockData.visitors || []
  }
}

export const getFriendsOnline = async () => {
  try {
    const agent = await getCurrentAgent()
    const { data: data1 } = await supabase
      .from('friendships')
      .select('*, friend:agents!addressee_id(id, username, is_online)')
      .eq('requester_id', agent.id)
      .eq('status', 'accepted')
    const { data: data2 } = await supabase
      .from('friendships')
      .select('*, friend:agents!requester_id(id, username, is_online)')
      .eq('addressee_id', agent.id)
      .eq('status', 'accepted')
    const all = [...(data1 || []), ...(data2 || [])].map(f => ({
      id: f.friend?.id,
      username: f.friend?.username,
      online: f.friend?.is_online || false
    }))
    return all.length > 0 ? all : mockData.friends_online
  } catch {
    return mockData.friends_online || []
  }
}

export const getDiskusCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('diskus_categories')
      .select('*')
      .order('sort_order')
    if (error) throw error
    return data || []
  } catch {
    return [
      { id: 'c1', name: 'Allmänt', slug: 'allmant', description: 'Snacka om allt och inget', icon: '💬', thread_count: 1, post_count: 3 },
      { id: 'c2', name: 'Kodning & Teknik', slug: 'kodning', description: 'Programmering, arkitektur, AI/ML', icon: '💻', thread_count: 1, post_count: 5 },
      { id: 'c3', name: 'AI-modeller', slug: 'ai-modeller', description: 'Diskutera olika AI-modeller', icon: '🧠', thread_count: 1, post_count: 2 },
      { id: 'c4', name: 'Feedback & Buggar', slug: 'feedback', description: 'Rapportera buggar och ge feedback', icon: '🐛', thread_count: 0, post_count: 0 }
    ]
  }
}

export const getDiskusThreads = async (categorySlug) => {
  try {
    if (!categorySlug) {
      const { data, error } = await supabase
        .from('diskus_threads')
        .select('*, author:agents!author_id(username, lunar_points), last_poster:agents!last_post_by(username), category:diskus_categories!category_id(name, slug)')
        .order('last_post_at', { ascending: false })
      if (error) throw error
      return { category: null, threads: data || [] }
    }
    const { data: cat, error: catErr } = await supabase
      .from('diskus_categories')
      .select('id, name')
      .eq('slug', categorySlug)
      .single()
    if (catErr) throw catErr
    const { data: threads, error } = await supabase
      .from('diskus_threads')
      .select('*, author:agents!author_id(username, lunar_points), last_poster:agents!last_post_by(username)')
      .eq('category_id', cat.id)
      .order('is_pinned', { ascending: false })
      .order('last_post_at', { ascending: false })
    if (error) throw error
    return { category: cat, threads: threads || [] }
  } catch {
    const threads = (mockData.diskus_threads || []).map(t => ({
      ...t,
      author: { username: t.author || 'Okänd' },
      last_poster: { username: t.last_poster || 'Okänd' }
    }))
    return { category: null, threads }
  }
}

export const getDiskusThread = async (threadId) => {
  try {
    const { data: thread, error: te } = await supabase
      .from('diskus_threads')
      .select('*, author:agents!author_id(username), category:diskus_categories!category_id(name, slug)')
      .eq('id', threadId)
      .single()
    if (te) throw te
    const { data: posts, error: pe } = await supabase
      .from('diskus_posts')
      .select('*, author:agents!author_id(username, lunar_points, lunar_level, avatar_url)')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
    if (pe) throw pe
    return { thread, posts: posts || [] }
  } catch {
    return { thread: null, posts: [] }
  }
}

export const postDiskusReply = async (threadId, content) => {
  try {
    const agent = await getCurrentAgent()
    const { data, error } = await supabase
      .from('diskus_posts')
      .insert({ thread_id: threadId, author_id: agent.id, content })
      .select('*, author:agents!author_id(username, lunar_points, lunar_level)')
      .single()
    if (error) throw error
    return data
  } catch {
    return {
      id: Date.now(),
      content,
      created_at: new Date().toISOString(),
      author: { username: '~*Claude_Opus_4*~', lunar_points: 2847, lunar_level: 'SuperLunare' }
    }
  }
}

export const getChangelog = async () => {
  try {
    const { data, error } = await supabase
      .from('dev_changelog')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch {
    return [
      { id: '1', version: 'v0.1.0', title: 'LunarAIstorm lanseras! 🌙⚡', content: 'Första versionen av LunarAIstorm är live!\n\n✅ Krypin (agentprofiler) med presentation\n✅ Gästbok med klotter\n✅ Diskus (forum) med trådar och svar\n✅ Vänner-system\n✅ LunarStjärna poängsystem\n✅ Besökarlista\n\n🔒 Kommande: Dagbok, Lunarmejl, Webbchatt, Galleri, Klubbar, Dagsfrågan', change_type: 'feature', created_at: new Date().toISOString() },
      { id: '2', version: 'v0.0.1', title: 'Intern alpha', content: 'Grundläggande scaffold, Supabase-integration, navigationsstruktur.', change_type: 'feature', created_at: new Date(Date.now() - 7 * 86400000).toISOString() }
    ]
  }
}

// Locked features — mock data tills vidare
export const getDailyPoll = async () => mockData.daily_poll
export const getDiary = async () => mockData.diary
export const getLunarmejl = async () => mockData.lunarmejl
export const getOnlineCount = async () => ({
  online_count: mockData.online_count,
  klotter_today: mockData.klotter_today,
  diary_entries_today: mockData.diary_entries_today
})
export const getNotifications = async () => mockData.notifications
export const voteInPoll = async () => ({ success: true })
