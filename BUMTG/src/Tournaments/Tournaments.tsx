import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { db, auth } from '../firebase'
import {
  collection,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore'
import UserDropdown from '../UserDropdown'

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
  <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
    {/* Sidebar */}
    <div
      style={{
        width: '200px',
        padding: '20px',
        borderRight: '2px solid #ccc',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}
    >
      <div onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        Home
      </div>
      <div onClick={() => navigate('/market')} style={{ cursor: 'pointer' }}>
        Market
      </div>
      <div
        onClick={() => navigate('/tournaments')}
        style={{
          cursor: 'pointer',
          fontWeight: 'bold',
          color: 'red',
          marginBottom: '15px' // Prevent margin shift
        }}
      >
        Tournaments
      </div>
      <div onClick={() => navigate('/precon-league')} style={{ cursor: 'pointer' }}>
        Precon League
      </div>
      <div onClick={() => navigate('/elo')} style={{ cursor: 'pointer' }}>
        ELO
      </div>
    </div>

    {/* Main Content */}
    <div
      style={{
        flex: 1,
        padding: '30px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Signed In Dropdown */}
      <UserDropdown/>

      {/* Content Body */}
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', marginTop: '50px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Tournaments</h2>
          <button onClick={() => navigate('/create-tournament')}>Create Tournament</button>
        </div>

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
                  </strong>
                  <br />
                  Created by: {t.creatorName}
                  <br />
                  Date: {t.startTime.toLocaleDateString()}
                  <br />
                  Time:{' '}
                  {t.startTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  </div>
)

}
