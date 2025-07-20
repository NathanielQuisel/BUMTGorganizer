// TournamentRouter.tsx
import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'
import DraftTournamentDetail from './DraftTournamentDetail'
import SwissTournamentDetail from './SwissTournamentDetail'

export default function TournamentRouter() {
  const { id } = useParams()
  const [format, setFormat] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFormat = async () => {
      if (!id) return
      const docRef = doc(db, 'tournaments', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setFormat(docSnap.data().format)
      }
      setLoading(false)
    }
    fetchFormat()
  }, [id])

  if (loading) return <div>Loading...</div>
  if (!format) return <div>Invalid tournament</div>

  return format === 'draft'
    ? <DraftTournamentDetail />
    : <SwissTournamentDetail />
}
