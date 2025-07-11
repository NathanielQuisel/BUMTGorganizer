import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { db, auth } from './firebase'
import {
  collection,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore'

type Tournament = {
  id: string
  name: string
  startTime: Date
  creatorUid: string
  creatorName: string
}

export default function Tournaments() {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [onlyMine, setOnlyMine] = useState(false)
  const [currentUid, setCurrentUid] = useState<string | null>(null)

  useEffect(() => {
    const user = auth.currentUser
    if (user) setCurrentUid(user.uid)

    const fetchTournaments = async () => {
      const snapshot = await getDocs(collection(db, 'tournaments'))

      const docs = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as {
          name: string
          startTime: any
          creatorUid: string
        })
      }))

      const nameCache: Record<string, string> = {}

      const tournamentsWithNames = await Promise.all(
        docs.map(async (t) => {
          let displayName = 'Unknown'

          if (nameCache[t.creatorUid]) {
            displayName = nameCache[t.creatorUid]
          } else {
            try {
              const userSnap = await getDoc(doc(db, 'users', t.creatorUid))
              if (userSnap.exists()) {
                displayName = userSnap.data().displayName
                nameCache[t.creatorUid] = displayName
              }
            } catch {
              console.warn(`Failed to fetch display name for ${t.creatorUid}`)
            }
          }

          return {
            id: t.id,
            name: t.name,
            startTime: t.startTime.toDate(),
            creatorUid: t.creatorUid,
            creatorName: displayName,
          }
        })
      )

      setTournaments(tournamentsWithNames)
    }

    fetchTournaments()
  }, [])

  // Apply filter and sort
  const visibleTournaments = tournaments
    .filter(t => !onlyMine || t.creatorUid === currentUid)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  return (
    <div style={{ padding: '20px' }}>
      <h2>Tournaments</h2>

      <button onClick={() => navigate('/create-tournament')}>
        Create Tournament
      </button>

      <div style={{ marginTop: '15px' }}>
        <label>
          <input
            type="checkbox"
            checked={onlyMine}
            onChange={(e) => setOnlyMine(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Show only my tournaments
        </label>
      </div>

      <div style={{ marginTop: '20px' }}>
        {visibleTournaments.length === 0 ? (
          <p>No tournaments to display.</p>
        ) : (
          <ul>
            {visibleTournaments.map((t) => (
              <li key={t.id} style={{ marginBottom: '15px' }}>
                <strong>
                    <Link to={`/tournament/${t.id}`}>{t.name}</Link>
                </strong><br />
                Created by: {t.creatorName}<br />
                Date: {t.startTime.toLocaleDateString()}<br />
                Time: {t.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
