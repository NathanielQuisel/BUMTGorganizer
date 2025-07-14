import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'

type League = {
  id: string
  name: string
  startDate: Date
}

export default function PreconLeague() {
  const navigate = useNavigate()
  const [leagues, setLeagues] = useState<League[]>([])

  useEffect(() => {
    const fetchLeagues = async () => {
      const snapshot = await getDocs(collection(db, 'preconLeagues'))
      const leagues = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name,
          startDate: data.startDate?.toDate?.() || new Date(),
        }
      })
      setLeagues(leagues)
    }

    fetchLeagues()
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Precon Leagues</h2>
        <button onClick={() => navigate('/dashboard')}>Home</button>
      </div>

      <button onClick={() => navigate('/create-precon-league')}>
        Create New League
      </button>

      <ul style={{ marginTop: '20px' }}>
        {leagues.map((league) => (
          <li key={league.id} style={{ marginBottom: '10px' }}>
            <Link to={`/precon-league/${league.id}`}>
              <strong>{league.name}</strong>
            </Link>
            <div>Start Date: {league.startDate.toLocaleDateString()}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
