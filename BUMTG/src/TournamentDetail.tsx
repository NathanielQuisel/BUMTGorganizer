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
  const [results, setResults] = useState<Record<string, Record<string, string>>>({})
  const [pods, setPods] = useState<Record<string, string[]>>({})
  const [nextPodId, setNextPodId] = useState(1)
  const [podSizeInput, setPodSizeInput] = useState<number>(0)
  const [draftStarted, setDraftStarted] = useState(false)
  const [userPodId, setUserPodId] = useState<string | null>(null)



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
            const currentRound = data.round || null
            setRound(currentRound)
            setWins(data.wins || {})
            setResults(data.results || {})
            setPods(data.pods || {})
            setNextPodId(
            data.pods ? Math.max(...Object.keys(data.pods).map(Number)) + 1 : 1
            )
            setDraftStarted(data.draftStarted || false);



            const allPairings = data.pairings || {}
            const roundPairings: Pair[] = allPairings[currentRound] || []
            setPairings(roundPairings)
            for (const pair of roundPairings) {
            if (pair.player1 === user.uid) {
                setUserOpponent(pair.player2)
                break
            } else if (pair.player2 === user.uid) {
                setUserOpponent(pair.player1)
                break
            }
            }
            if (data.draftStarted && data.pods) {
                for (const [podId, members] of Object.entries(data.pods as Record<string, string[]>)) {
                    if (members.includes(user.uid)) {
                        setUserPodId(podId);
                        break;
                    }
                }
            }
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

  const getMatchKey = (uid1: string, uid2: string) =>
    [uid1, uid2].sort().join('_')

  const matchKey = userUid && userOpponent ? getMatchKey(userUid, userOpponent) : null
  const matchWinnerUid = matchKey && round !== null ? results[round]?.[matchKey] : null

  const handleJoin = async () => {
    if (!id || !userUid) return
    await updateDoc(doc(db, 'tournaments', id), {
      participants: arrayUnion(userUid),
    })
    setHasJoined(true)
    setParticipants((prev) => [...prev, userUid])
  }

  const handleDrop = async () => {
    if (!id || !userUid) return;

    // If tournament has started, confirm before dropping
    if (round || draftStarted) {
        const confirmDrop = window.confirm(
        "Are you sure you want to drop from the tournament? This action cannot be undone."
        );
        if (!confirmDrop) return;
    }

    // Proceed with drop
    await updateDoc(doc(db, 'tournaments', id), {
        participants: arrayRemove(userUid),
    });

    setHasJoined(false);
    setParticipants((prev) => prev.filter((uid) => uid !== userUid));
  };


    const handleRandomizePairings = async () => {
    if (!id) return;

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const pairs: Pair[] = [];

    for (let i = 0; i < shuffled.length; i += 2) {
        const p1 = shuffled[i];
        const p2 = shuffled[i + 1] || null;
        pairs.push({ player1: p1, player2: p2 });
    }

    try {
        const docRef = doc(db, 'tournaments', id);

        // Overwrite the pairings object with only round 1
        await updateDoc(docRef, {
        pairings: { 1: pairs },
        results: { 1: {} }, // reset results for round 1
        });

        setPairings(pairs);
        setResults({});
        console.log('Pairings for round 1 created and previous data reset.');
    } catch (error) {
        console.error('Error saving pairings:', error);
    }
    };


  const handleStartTournament = async () => {
    if (!id) return

    const confirmDrop = window.confirm(
        "Are you sure you want to start the tournament? This action cannot be undone."
    );
    if (!confirmDrop) return;

    try {
      await updateDoc(doc(db, 'tournaments', id), { round: 1, results: { 1: {} } })
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
    if (!id || !pendingWinnerUid || !userUid || !userOpponent || round === null) return

    const matchKey = getMatchKey(userUid, userOpponent)

    const tournamentRef = doc(db, 'tournaments', id)
    const tournamentSnap = await getDoc(tournamentRef)
    if (!tournamentSnap.exists()) return

    const data = tournamentSnap.data()
    const wins = data.wins || {}
    const results = data.results || {}

    const updatedWins = {
      ...wins,
      [pendingWinnerUid]: (wins[pendingWinnerUid] || 0) + 1,
    }

    const updatedResults = {
      ...results,
      [round]: {
        ...(results[round] || {}),
        [matchKey]: pendingWinnerUid,
      }
    }

    await updateDoc(tournamentRef, {
      wins: updatedWins,
      results: updatedResults,
    })

    setWins(updatedWins)
    setResults(updatedResults)
    setConfirmingWinner(false)
    setPendingWinnerUid(null)
  }

  const handlePairNextRound = async () => {
    if (!id || round === null) return

    const nextRound = round + 1
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    const newPairs: Pair[] = []

    for (let i = 0; i < shuffled.length; i += 2) {
      const p1 = shuffled[i]
      const p2 = shuffled[i + 1] || null
      newPairs.push({ player1: p1, player2: p2 })
    }

    const docRef = doc(db, 'tournaments', id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      console.error('Tournament document not found.')
      return
    }

    const data = docSnap.data()
    const existingPairings = data.pairings || {}
    const existingResults = data.results || {}

    const updatedPairings = {
      ...existingPairings,
      [nextRound]: newPairs,
    }

    const updatedResults = {
      ...existingResults,
      [nextRound]: {},
    }

    await updateDoc(docRef, {
      round: nextRound,
      pairings: updatedPairings,
      results: updatedResults,
    })

    setRound(nextRound)
    setPairings(newPairs)
  }

  const handleAddPod = async () => {
    if (!id || podSizeInput <= 0) return

    const newPod = new Array(podSizeInput).fill('')
    const newPodId = nextPodId

    const updatedPods = {
        ...pods,
        [newPodId]: newPod
    }

    try {
        await updateDoc(doc(db, 'tournaments', id), {
        pods: updatedPods
        })

        setPods(updatedPods)
        setNextPodId(prev => prev + 1)
    } catch (err) {
        console.error('Failed to save pod to Firestore:', err)
    }
  }


  const handleDeletePod = async (podIdToDelete: string) => {
    if (!id) return;

    const updatedPods = { ...pods };
    delete updatedPods[podIdToDelete];

    try {
        await updateDoc(doc(db, 'tournaments', id), {
        pods: updatedPods
        });
        setPods(updatedPods);
    } catch (err) {
        console.error('Failed to delete pod:', err);
    }
  };

  const handleRandomizePods = async () => {
    if (!id || Object.keys(pods).length === 0 || participants.length === 0) return;

    // 1. Shuffle participants
    const shuffled = [...participants].sort(() => Math.random() - 0.5);

    // 2. Assign to pods
    const newPods: Record<string, string[]> = {};
    let index = 0;

    for (const [podId, podArray] of Object.entries(pods)) {
        const podSize = podArray.length;
        newPods[podId] = [];

        for (let i = 0; i < podSize && index < shuffled.length; i++) {
        newPods[podId].push(shuffled[index]);
        index++;
        }
    }

    // 3. Save to database
    try {
        const docRef = doc(db, 'tournaments', id);
        await updateDoc(docRef, { pods: newPods });
        setPods(newPods);
        console.log('Pods randomized and saved successfully.');
    } catch (err) {
        console.error('Error updating randomized pods:', err);
    }
  };

  const handleStartDraft = async () => {
    if (!id) return;

    const confirmDrop = window.confirm(
        "Are you sure you want to start the tournament? This action cannot be undone."
    );
    if (!confirmDrop) return;

    setDraftStarted(true);

    // Find which pod the current user is in
    for (const [podId, members] of Object.entries(pods)) {
        if (members.includes(userUid)) {
        setUserPodId(podId);
        break;
        }
    }

    // Optionally save draftStarted state in Firestore if you want persistence:
    await updateDoc(doc(db, 'tournaments', id), { draftStarted: true });
  }




  return (
    <div style={{ padding: '20px' }}>
      <h2>{name}</h2>
      
      {isOwner && (
        
        <div style={{ marginBottom: '20px' }}>
            {format === 'swiss' && (round ? (
                <button onClick={handlePairNextRound}>
                    {'Pair Next Round'}
                </button>
            ) : (
               <button onClick={handleStartTournament}>
                    {'Start Tournament'}
                </button> 
            ))}
            {!round && format === 'swiss' && (
                <button onClick={handleRandomizePairings}>Randomize Pairings</button>
            )}

            {!draftStarted && format === 'draft' && (
                <>
                    <button onClick={handleStartDraft}>
                    Start Tournament
                    </button>
                    <button onClick={handleRandomizePods}>
                    Randomize Pods
                    </button>
                </>
            )}

        </div>
      )}


      {(!round && !draftStarted) ? (
            hasJoined ? (
                <button onClick={handleDrop}>Drop from Tournament</button>
            ) : (
                <button onClick={handleJoin}>Join Tournament</button>
            )
            ) : (
            hasJoined && (
                <button onClick={handleDrop}>Drop from Tournament</button>
            )
        )}


      {round && (
  matchWinnerUid ? (
    <div style={{ marginTop: '20px', fontWeight: 'bold' }}>
      {participantMap[matchWinnerUid]} defeated {
        participantMap[
          matchWinnerUid === userUid ? userOpponent! : userUid
        ]
      }
    </div>
  ) : (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '20px' }}>
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
        {userOpponent && participantMap[userOpponent]
          ? participantMap[userOpponent]
          : '(Unknown)'}
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
  )
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

        {format === 'draft' && (
<div style={{ marginTop: '30px' }}>
  <h3>Draft Pods</h3>

  {Object.entries(pods)
    .filter(([podId]) => !draftStarted || podId === userPodId)
    .map(([podId, members]) => (
      <div key={podId} style={{ marginBottom: '10px', border: '1px solid #ccc', padding: '10px' }}>
        <strong>Pod {podId}</strong>:{" "}
        {members.length > 0
          ? members.map((uid) => participantMap[uid] || '(Unknown)').join(', ')
          : '(empty)'}

        {isOwner && !draftStarted && (
          <button
            onClick={() => handleDeletePod(podId)}
            style={{ marginLeft: '10px', color: 'white', backgroundColor: 'red' }}
          >
            Delete Pod
          </button>
        )}

        {draftStarted && podId === userPodId && (
          <button style={{ marginLeft: '10px' }}>
            Start Pod
          </button>
        )}
      </div>
    ))}


    {isOwner && !draftStarted && (<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
      <label>
        Pod Size:
        <input
          type="number"
          min={0}
          value={podSizeInput}
          onChange={e => setPodSizeInput(parseInt(e.target.value))}
          style={{ width: '60px', marginLeft: '5px' }}
        />
      </label>
      <button onClick={handleAddPod}>Add Pod</button>
    </div>)}
    
  </div>
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
