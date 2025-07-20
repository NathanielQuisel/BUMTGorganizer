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

export default function DraftTournamentDetail() {
  type Pair = { player1: string, player2: string | null }

  const { id } = useParams()
  const [name, setName] = useState('')
  const [participants, setParticipants] = useState<string[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [userUid, setUserUid] = useState('')
  const [pairings, setPairings] = useState<Pair[]>([])
  const [participantMap, setParticipantMap] = useState<Record<string, string>>({})
  const [userOpponent, setUserOpponent] = useState<string | null>(null)
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
  const [podRounds, setPodRounds] = useState<Record<string, number>>({})
  

  

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
            setParticipants(data.participants || [])
            setIsOwner(data.creatorUid === user.uid)
            setHasJoined((data.participants || []).includes(user.uid))
            const currentRound = data.round || null
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
            setPodRounds(data.rounds || {})
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
  const currentRound = userPodId !== null ? podRounds[userPodId] : 0;

  const getMatchKey = (uid1: string, uid2: string) =>
    [uid1, uid2].sort().join('_')

  const matchKey = userUid && userOpponent ? getMatchKey(userUid, userOpponent) : null
  //change this so it checks based on the current users pod round
  const matchWinnerUid = matchKey && currentRound !== null ? results[currentRound]?.[matchKey] : null

const podParticipants = userPodId ? pods[userPodId] || [] : [];

const podExpectedGames = currentRound ? Math.floor(podParticipants.length / 2) * currentRound : 0;

const podReportedGames = Object.entries(results)
  .filter(([_, matches]) => {
    return Object.keys(matches).some(matchKey => {
      const [id1, id2] = matchKey.split('_');
      return podParticipants.includes(id1) && podParticipants.includes(id2);
    });
  })
  .reduce((sum, [_, matches]) => {
    const podMatchCount = Object.entries(matches).filter(([matchKey]) => {
      const [id1, id2] = matchKey.split('_');
      return podParticipants.includes(id1) && podParticipants.includes(id2);
    }).length;
    return sum + podMatchCount;
  }, 0);

const podGamesRemaining = podExpectedGames - podReportedGames;



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
    if (draftStarted) {
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
    if (!id || !pendingWinnerUid || !userUid || !userOpponent) return

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
      [currentRound]: {
        ...(results[currentRound] || {}),
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

  const confirmStart = window.confirm(
    "Are you sure you want to start the draft tournament? This action cannot be undone."
  );
  if (!confirmStart) return;

  const allPairings: Pair[] = [];
  const podRounds: Record<string, number> = {}; // <-- New podRounds object

  for (const [podId, podMembers] of Object.entries(pods)) {
    const half = Math.floor(podMembers.length / 2);

    for (let i = 0; i < half; i++) {
      const player1 = podMembers[i];
      const player2 = podMembers[i + half] || null;
      allPairings.push({ player1, player2 });
    }

    podRounds[podId] = 1; // Set round 1 for each pod
  }

  try {
    await updateDoc(doc(db, 'tournaments', id), {
      draftStarted: true,
      pairings: { 1: allPairings },
      results: { 1: {} },
      podRounds, // <- store pod-specific rounds in Firestore
    });

    setDraftStarted(true);
    setPairings(allPairings);
    setResults({});
    setPodRounds(podRounds); // <- set local podRounds state

    for (const [podId, members] of Object.entries(pods)) {
      if (members.includes(userUid)) {
        setUserPodId(podId);
        break;
      }
    }

    console.log('Draft started and pairings initialized.');
  } catch (error) {
    console.error('Error starting draft tournament:', error);
  }
};


  const handlePairNextDraftRound = async () => {
  if (!id || !userUid || !userPodId) return;

  const docRef = doc(db, 'tournaments', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    console.error('Tournament not found');
    return;
  }

  const data = docSnap.data();
  const wins: Record<string, number> = data.wins || {};
  const allPods: Record<string, string[]> = data.pods || {};
  const podPlayers = allPods[userPodId] || [];
  const existingPairings = data.pairings || {};
  const existingResults = data.results || {};
  const podRounds = data.rounds || {};

  const currentPodRound = podRounds[userPodId] || 0;
  const nextPodRound = currentPodRound + 1;

  const sorted = [...podPlayers].sort((a, b) => (wins[b] || 0) - (wins[a] || 0));

  const podPairs: Pair[] = [];
  for (let i = 0; i < sorted.length; i += 2) {
    const p1 = sorted[i];
    const p2 = sorted[i + 1] || null;
    podPairs.push({ player1: p1, player2: p2 });
  }

  const updatedPairings = {
    ...existingPairings,
    [nextPodRound]: [...(existingPairings[nextPodRound] || []), ...podPairs],
  };

  const updatedResults = {
    ...existingResults,
    [nextPodRound]: {
      ...(existingResults[nextPodRound] || {}),
    },
  };

  const updatedRounds = {
    ...podRounds,
    [userPodId]: nextPodRound,
  };

  await updateDoc(docRef, {
    pairings: updatedPairings,
    results: updatedResults,
    rounds: updatedRounds,
  });

  setPairings(podPairs);
  setPodRounds(updatedRounds);
};

  

  const handleCheckRemainingDraftMatches = () => {
  if (!userPodId || !results[currentRound]) {
    alert("No current round or pod data available.");
    return;
  }

  const podPlayers = pods[userPodId] || [];
  const roundResults = results[currentRound] || {};
  const unfinishedGames: string[] = [];

  for (let i = 0; i < podPlayers.length; i++) {
    for (let j = i + 1; j < podPlayers.length; j++) {
      const uid1 = podPlayers[i];
      const uid2 = podPlayers[j];
      const matchKey = getMatchKey(uid1, uid2);

      if (!roundResults[matchKey]) {
        const name1 = participantMap[uid1] || '(Unknown)';
        const name2 = participantMap[uid2] || '(Unknown)';
        unfinishedGames.push(`${name1} vs ${name2}`);
      }
    }
  }

  if (unfinishedGames.length > 0) {
    alert("Unfinished Matches:\n" + unfinishedGames.join('\n'));
  } else {
    alert("All matches in your pod are complete.");
  }
};



  return (
    <div style={{ padding: '20px' }}>
      <h2>{name}</h2>
      
      {isOwner && (
        
        <div style={{ marginBottom: '20px' }}>

            {!draftStarted && (
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
   {draftStarted && userPodId && (
  podGamesRemaining > 0 ? (
    <button onClick={handleCheckRemainingDraftMatches}>
      Check Remaining Matches
    </button>
  ) : (
    <button onClick={handlePairNextDraftRound}>
      Pair Next Round
    </button>
  )
)}


      {!draftStarted ? (
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


      {currentRound > 0 && ( //will likely have to change because now round is being stored per pod
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

        {
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
}



      <h3 style={{ marginTop: '30px' }}>Participants</h3>
        <ul>
        {participants.map((uid, _) => (
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
