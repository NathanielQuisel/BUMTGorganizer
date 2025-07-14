import { Routes, Route, useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { auth, db, googleProvider } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import Dashboard from './Dashboard'
import Tournaments from './Tournaments'
import CreateTournament from './CreateTournament'
import TournamentDetail from './TournamentDetail'
import ELO from './ELO'
import PreconLeague from './PreconLeague'
import CreatePreconLeague from './CreatePreconLeague'
import PreconLeagueDetail from './PreconLeagueDetail'
import Market from './Market'


function HomePage() {
  const navigate = useNavigate()

  const handleGoogleSignIn = () => {
    signInWithPopup(auth, googleProvider)
      .then(async (result) => {
        const user = result.user
        console.log('Signed in as:', user.email)

        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          // Create new user document with default ELO
          await setDoc(userRef, {
            displayName: user.displayName || user.email || 'Anonymous',
            elo: 1000
          })
        } else {
          const data = userSnap.data()
          if (data.elo === undefined) {
            await setDoc(userRef, { elo: 1000 }, { merge: true })
          }
        }

        navigate('/dashboard')
      })
      .catch((error) => {
        alert('Google Sign-In failed: ' + error.message)
    })
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1 style={{ fontSize: '3rem' }}>Welcome to the BUMTG app</h1>
      <div style={{ marginTop: '30px' }}>
        <button onClick={handleGoogleSignIn} style={{ fontSize: '1.5rem', padding: '10px 20px' }}>
          Sign in with Google
        </button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="tournaments" element={<Tournaments />} />
      <Route path="create-tournament" element={<CreateTournament />} />
      <Route path="/tournament/:id" element={<TournamentDetail />} />
      <Route path="/elo" element={<ELO />} />
      <Route path="/precon-league" element={<PreconLeague />} />
      <Route path="/create-precon-league" element={<CreatePreconLeague />} />
      <Route path="/precon-league/:id" element={<PreconLeagueDetail />} />
      <Route path="/market" element={<Market />} />
    </Routes>
  )
}
