import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from './firebase'
import { collection, getDocs } from 'firebase/firestore'

type Tournament = {
  id: string
  name: string
  startTime: Date
  creatorName: string
}

export default function Tournaments() {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState<Tournament[]>([])

  useEffect(() => {
    const fetchTournaments = async () => {
      const snapshot = await getDocs(collection(db, 'tournaments'))

      const data = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          name: data.name,
          startTime: data.startTime.toDate(),
          creatorName: data.creatorName || 'Unknown',
        }
      })

      setTournaments(data)
    }

    fetchTournaments()
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h2>Tournaments</h2>
      <button onClick={() => navigate('/create-tournament')}>
        Create Tournament
      </button>

      <div style={{ marginTop: '20px' }}>
        {tournaments.length === 0 ? (
          <p>No tournaments yet.</p>
        ) : (
          <ul>
            {tournaments.map((t) => (
              <li key={t.id} style={{ marginBottom: '15px' }}>
                <strong>{t.name}</strong><br />
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
