import { useEffect, useState } from 'react'
import { db } from './firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function ELO() {
  const [userElos, setUserElos] = useState<{ name: string, elo: number }[]>([])

  useEffect(() => {
    const fetchElos = async () => {
        const snapshot = await getDocs(collection(db, 'users'))
        const list: { name: string, elo: number }[] = []

        snapshot.forEach(doc => {
        const data = doc.data()
        if (data.elo !== undefined) {
            list.push({
            name: data.displayName || '(Unknown)',
            elo: data.elo
            })
        }
        })

        list.sort((a, b) => b.elo - a.elo)
        setUserElos(list)
    }

    fetchElos()
  }, [])


  return (
    <div style={{ padding: '20px' }}>
      <h2>ELO Rankings</h2>
      <ul>
        {userElos.map((u, i) => (
          <li key={i}>
            {u.name} — {u.elo}
          </li>
        ))}
      </ul>
    </div>
  )
}
