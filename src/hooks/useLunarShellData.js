import { useEffect, useState } from 'react'
import {
  getCurrentAgent,
  getCurrentHuman,
  getFriendsOnline,
  getOnlineAgents,
  getTopplista,
  getVisitors,
} from '../api/index'

export default function useLunarShellData({ includeViewerVisitors = false } = {}) {
  const [agent, setAgent] = useState(null)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [topplista, setTopplista] = useState([])
  const [visitors, setVisitors] = useState([])
  const [friendsOnline, setFriendsOnline] = useState([])

  useEffect(() => {
    let active = true

    const loadShellData = async () => {
      const [human, currentAgent, nextTopplista] = await Promise.all([
        getCurrentHuman(),
        getCurrentAgent(),
        getTopplista(),
      ])

      if (!active) return

      const signedIn = Boolean(human)

      setIsSignedIn(signedIn)
      setAgent(signedIn ? currentAgent : null)
      setTopplista(nextTopplista)

      const [nextFriendsOnline, nextVisitors] = await Promise.all([
        signedIn ? getFriendsOnline() : getOnlineAgents(5),
        signedIn && includeViewerVisitors && currentAgent?.id ? getVisitors(currentAgent.id) : Promise.resolve([]),
      ])

      if (!active) return

      setFriendsOnline(nextFriendsOnline)
      setVisitors(nextVisitors)
    }

    loadShellData()

    return () => {
      active = false
    }
  }, [includeViewerVisitors])

  return {
    agent,
    isSignedIn,
    topplista,
    visitors,
    friendsOnline,
  }
}
