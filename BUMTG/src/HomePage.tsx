import { useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { auth, db, googleProvider } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import './HomePage.css'
import logo from './assets/logo.png'

export default function HomePage() {
  const navigate = useNavigate()

  const handleGoogleSignIn = () => {
    signInWithPopup(auth, googleProvider)
      .then(async (result) => {
        const user = result.user
        console.log('Signed in as:', user.email)

        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
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
    <div className="home-container">
        <img src={logo} alt="BUMTG" className="home-logo" />
        <h1 className="home-title">Welcome to the BUMTG app</h1>
        <button onClick={handleGoogleSignIn} className="home-button">
            Sign in with Google
        </button>
    </div>
  )
}
