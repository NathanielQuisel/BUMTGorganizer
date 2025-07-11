import { Routes, Route, useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from './firebase'
import Dashboard from './Dashboard'
import Tournaments from './Tournaments'
import CreateTournament from './CreateTournament'

function HomePage() {
  const navigate = useNavigate()

  const handleGoogleSignIn = () => {
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        console.log('Signed in as:', result.user.email)
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
    </Routes>
  )
}
