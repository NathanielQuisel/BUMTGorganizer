import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { auth, db } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'

export default function TournamentDetail() {
  const { id } = useParams()
  const [name, setName] = useState('')
  const [format, setFormat] = useState('')
  const [creatorUid, setCreatorUid] = useState('')
  const [participants, setParticipants] = useState<string[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [userUid, setUserUid] = useState('')
  const [participantNames, setParticipantNames] = useState<string[]>([])
  const [pairings, setPairings] = useState<[string, string | null][]>([])
  const [participantMap, setParticipantMap] = useState<Record<string, string>>({})




    useEffect(() => {
        if (!id) return

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) return

            setUserUid(user.uid)

            const docRef = doc(db, 'tournaments', id)
            const docSnap = await getDoc(docRef)

            if (docSnap.exists()) {
            const data = docSnap.data()
            setName(data.name)
            setCreatorUid(data.creatorUid)
            setParticipants(data.participants || [])
            setFormat(data.format || '')

            setIsOwner(data.creatorUid === user.uid)
            setHasJoined((data.participants || []).includes(user.uid))
            }
        })

        return () => unsubscribe()
    }, [id])


  useEffect(() => {
    const fetchNames = async () => {
        const names: string[] = await Promise.all(
        participants.map(async (uid) => {
            try {
            const userSnap = await getDoc(doc(db, 'users', uid))
            if (userSnap.exists()) {
                return userSnap.data().displayName || '(No name)'
            } else {
                return '(Unknown)'
            }
            } catch {
            return '(Error)'
            }
        })
        )
        setParticipantNames(names)
        const map: Record<string, string> = {}
        participants.forEach((uid, i) => {
            map[uid] = names[i]
        })
        setParticipantMap(map)
    }

    if (participants.length > 0) {
        fetchNames()
    }
  }, [participants])

  const handleJoin = async () => {
    if (!id || !userUid) return
    await updateDoc(doc(db, 'tournaments', id), {
      participants: arrayUnion(userUid),
    })
    setHasJoined(true)
    setParticipants((prev) => [...prev, userUid])
  }

  const handleDrop = async () => {
    if (!id || !userUid) return
    await updateDoc(doc(db, 'tournaments', id), {
      participants: arrayRemove(userUid),
    })
    setHasJoined(false)
    setParticipants((prev) => prev.filter((uid) => uid !== userUid))
  }

  const handleRandomizePairings = () => {
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    const pairs: [string, string | null][] = []

    for (let i = 0; i < shuffled.length; i += 2) {
        const p1 = shuffled[i]
        const p2 = shuffled[i + 1] || null // handle odd number of players
        pairs.push([p1, p2])
    }

    setPairings(pairs)
  }


  return (
    <div style={{ padding: '20px' }}>
      <h2>{name}</h2>
      
      {isOwner && (
        
        <div style={{ marginBottom: '20px' }}>
            <button>Start Tournament</button>
            {format === 'swiss' && (
                <button onClick={handleRandomizePairings}>Randomize Pairings</button>
            )}


            {format === 'draft' && (
                <button>Randomize Pods</button>
            )}

        </div>
      )}


      {hasJoined ? (
        <button onClick={handleDrop}>Drop from Tournament</button>
      ) : (
        <button onClick={handleJoin}>Join Tournament</button>
      )}

        {pairings.length > 0 && (
        <>
            <h3>Current Pairings</h3>
            <ul>
            {pairings.map(([p1, p2], index) => (
                <li key={index}>
                {participantMap[p1] || '(Unknown)'} vs {p2 ? participantMap[p2] || '(Unknown)' : 'Bye'}
                </li>
            ))}
            </ul>
        </>
        )}


      <h3 style={{ marginTop: '30px' }}>Participants</h3>
        <ul>
            {participantNames.map((name, index) => (
                <li key={index}>{name}</li>
            ))}
        </ul>
    </div>
  )
}
