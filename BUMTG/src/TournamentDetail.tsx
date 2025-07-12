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
  type Pair = { player1: string, player2: string | null }

  const { id } = useParams()
  const [name, setName] = useState('')
  const [format, setFormat] = useState('')
  const [creatorUid, setCreatorUid] = useState('')
  const [participants, setParticipants] = useState<string[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [userUid, setUserUid] = useState('')
  const [participantNames, setParticipantNames] = useState<string[]>([])
  const [pairings, setPairings] = useState<Pair[]>([])
  const [participantMap, setParticipantMap] = useState<Record<string, string>>({})
  const [userOpponent, setUserOpponent] = useState<string | null>(null)
  const [round, setRound] = useState<number | null>(null)
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [confirmingWinner, setConfirmingWinner] = useState(false)
  const [pendingWinnerUid, setPendingWinnerUid] = useState<string | null>(null)
  const [wins, setWins] = useState<Record<string, number>>({})




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
                setPairings(data.currentPairings || [])
                for (const pair of data.currentPairings || []) {
                    if (pair.player1 === user.uid) {
                        setUserOpponent(pair.player2)
                        break
                    } else if (pair.player2 === user.uid) {
                        setUserOpponent(pair.player1)
                        break
                    }
                }
                setRound(data.round || null)
                setWins(data.wins || {})
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

  const handleRandomizePairings = async () => {
    if (!id) return
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    const pairs: Pair[] = []

    for (let i = 0; i < shuffled.length; i += 2) {
        const p1 = shuffled[i]
        const p2 = shuffled[i + 1] || null
        pairs.push({ player1: p1, player2: p2 })
    }

    try {
        await updateDoc(doc(db, 'tournaments', id), {
            currentPairings: pairs,
        })
        setPairings(pairs)
        console.log('Pairings saved successfully')
    } catch (error) {
        console.error('Error saving pairings:', error)
    }
  }

 const handleStartTournament = async () => {
    if (!id) return

    try {
        await updateDoc(doc(db, 'tournaments', id), {
            round: 1,
        })
        setRound(1)
    } catch (err) {
        console.error('Failed to start tournament:', err)
    }
  }

  const handleConfirmScores = () => {
    if (playerScore === opponentScore) {
        alert("It's a tie! No winner.")
        return
    }

    const winner = playerScore > opponentScore ? userUid : userOpponent
    setPendingWinnerUid(winner)
    setConfirmingWinner(true)
  }

  const finalizeWinner = async () => {
    if (!id || !pendingWinnerUid) return

    const tournamentRef = doc(db, 'tournaments', id)
    const tournamentSnap = await getDoc(tournamentRef)
    if (!tournamentSnap.exists()) return

    const data = tournamentSnap.data()
    const wins = data.wins || {}  // wins is a map: { [uid]: number }

    const updatedWins = {
        ...wins,
        [pendingWinnerUid]: (wins[pendingWinnerUid] || 0) + 1,
    }

    await updateDoc(tournamentRef, { wins: updatedWins })
    setConfirmingWinner(false)
    setPendingWinnerUid(null)
  }


  return (
    <div style={{ padding: '20px' }}>
      <h2>{name}</h2>
      
      {isOwner && (
        
        <div style={{ marginBottom: '20px' }}>
            {isOwner && (
                <button onClick={handleStartTournament}>
                    {round ? 'Pair Next Round' : 'Start Tournament'}
                </button>
            )}
            {!round && format === 'swiss' && (
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

      {userOpponent && (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div>
                {participantMap[userUid] || 'You'}:
                <input
                type="number"
                min={0}
                max={2}
                value={playerScore}
                onChange={(e) => setPlayerScore(parseInt(e.target.value))}
                style={{ width: '40px', marginLeft: '5px' }}
                />
            </div>

            <div>
                {participantMap[userOpponent] || '(Unknown)'}:
                <input
                type="number"
                min={0}
                max={2}
                value={opponentScore}
                onChange={(e) => setOpponentScore(parseInt(e.target.value))}
                style={{ width: '40px', marginLeft: '5px' }}
                />
            </div>

            <button onClick={handleConfirmScores}>Confirm</button>
            </div>
        )}

        {confirmingWinner && pendingWinnerUid && (
            <div style={{
                marginTop: '10px',
                border: '1px solid #ccc',
                padding: '10px',
                background: '#f8f8f8',
            }}>
                <p>
                Confirm that <strong>{participantMap[pendingWinnerUid]}</strong> won this match?
                </p>
                <button onClick={finalizeWinner}>Confirm</button>
                <button onClick={() => setConfirmingWinner(false)}>Cancel</button>
            </div>
            )}


        {isOwner && pairings.length > 0 && (
        <>
            <h3>Current Pairings</h3>
            <ul>
            {pairings.map((pair, index) => (
                <li key={index}>
                    {participantMap[pair.player1] || '(Unknown)'}
                    {' vs '}
                    {pair.player2 ? participantMap[pair.player2] || '(Unknown)' : 'Bye'}
                </li>
            ))}
            </ul>
        </>
        )}


      <h3 style={{ marginTop: '30px' }}>Participants</h3>
        <ul>
        {participants.map((uid, i) => (
            <li key={uid}>
            {participantMap[uid] || '(Unknown)'}
            {' — '}
            Wins: {wins[uid] || 0}
            </li>
        ))}
        </ul>
    </div>
  )
}
