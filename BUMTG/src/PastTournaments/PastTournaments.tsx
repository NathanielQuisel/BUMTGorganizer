// src/PastTournaments.tsx
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'
import UserDropdown from '../UserDropdown'

type PastTournament = {
  id: string
  name: string
  endTime: Date
}

export default function PastTournaments() {
  const [tournaments, setTournaments] = useState<PastTournament[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPastTournaments = async () => {
      const snapshot = await getDocs(collection(db, 'pastTournaments'))

      const data = snapshot.docs.map(docSnap => {
        const raw = docSnap.data()
        return {
          id: docSnap.id,
          name: raw.name,
          endTime: raw.endTime?.toDate?.() ?? new Date(0), // fallback to epoch if missing
        }
      })

      setTournaments(data)
    }

    fetchPastTournaments()
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '200px', padding: '20px', borderRight: '1px solid #ccc' }}>
        <div onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', marginBottom: '10px' }}>
          Home
        </div>
        <div onClick={() => navigate('/market')} style={{ cursor: 'pointer' }}>
          Market
        </div>
        <div onClick={() => navigate('/tournaments')} style={{ cursor: 'pointer', marginTop: '10px' }}>
          Tournaments
        </div>
        <div onClick={() => navigate('/precon-league')} style={{ cursor: 'pointer', marginTop: '10px' }}>
          Precon League
        </div>
        <div onClick={() => navigate('/elo')} style={{ cursor: 'pointer', marginTop: '10px' }}>
          ELO
        </div>
        <div style={{ fontWeight: 'bold', color: 'red', marginTop: '10px' }}>
          Past Tournaments
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '30px', position: 'relative' }}>
        <UserDropdown />
        <h2>Past Tournaments</h2>

        {tournaments.length === 0 ? (
          <p>No past tournaments found.</p>
        ) : (
          <ul>
            {tournaments.map((t) => (
              <li key={t.id} style={{ marginBottom: '15px' }}>
                <strong>
                  <Link to={`/past-tournaments/${t.id}`}>{t.name}</Link>
                </strong>
                <br />
                Ended: {t.endTime.toLocaleDateString()} at {t.endTime.toLocaleTimeString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
