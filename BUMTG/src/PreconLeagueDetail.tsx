import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { auth, db } from './firebase'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'

export default function PreconLeagueDetail() {
  const { id } = useParams()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [participants, setParticipants] = useState<string[]>([])
  const [userUid, setUserUid] = useState<string | null>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [participantNames, setParticipantNames] = useState<string[]>([])
  const [isOwner, setIsOwner] = useState(false)


  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser
      if (!user || !id) return

      setUserUid(user.uid)

      const leagueRef = doc(db, 'preconLeagues', id)
      const leagueSnap = await getDoc(leagueRef)

      if (leagueSnap.exists()) {
        const data = leagueSnap.data()
        setName(data.name)
        setStartDate(data.startDate?.toDate()?.toLocaleDateString() || '')
        setIsOwner(data.creatorUid === user.uid)
        const p = data.participants || []
        setParticipants(p)
        setHasJoined(p.includes(user.uid))

        // Load display names
        const names = await Promise.all(
          p.map(async (uid: string) => {
            const userSnap = await getDoc(doc(db, 'users', uid))
            return userSnap.exists() ? userSnap.data().displayName : '(Unknown)'
          })
        )
        setParticipantNames(names)
      }
    }

    fetchData()
  }, [id])

  const handleJoin = async () => {
    if (!id || !userUid) return
    const leagueRef = doc(db, 'preconLeagues', id)
    await updateDoc(leagueRef, {
      participants: arrayUnion(userUid),
    })
    setParticipants(prev => [...prev, userUid])
    setHasJoined(true)
  }

  const handleDrop = async () => {
    if (!id || !userUid) return;

     await updateDoc(doc(db, 'preconLeagues', id), {
            participants: arrayRemove(userUid),
        });
    
    setHasJoined(false);
    setParticipants((prev) => prev.filter((uid) => uid !== userUid));
  }

  return (
    <div style={{ padding: '20px' }}>
        <h2>{name}</h2>
        <p>Start Date: {startDate}</p>

        <button style={{ marginBottom: '10px' }}>
        Swaps Spreadsheet
        </button>

        {isOwner && (
        <div style={{ marginBottom: '10px' }}>
            <button style={{ marginRight: '10px' }}>
            Pair This Week
            </button>
            <button>
            Subtract a Week
            </button>
        </div>
        )}

        {!hasJoined ? (
        <button onClick={handleJoin}>Join League</button>
        ) : (
        <button onClick={handleDrop}>Drop from League</button>
        )}

        <h3 style={{ marginTop: '20px' }}>Participants</h3>
        <ul>
        {participantNames.map((name, idx) => (
            <li key={idx}>{name}</li>
        ))}
        </ul>
    </div>
  )

}
