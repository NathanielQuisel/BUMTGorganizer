import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from './firebase'
import { signOut } from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore'

export default function Dashboard() {
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [uid, setUid] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserEmail(user.email)
        setUid(user.uid)

        // Fetch display name from Firestore
        const docRef = doc(db, 'users', user.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setDisplayName(docSnap.data().displayName)
        }
      } else {
        navigate('/')
      }
    })

    return () => unsubscribe()
  }, [navigate])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  const handleChangeDisplayName = async () => {
    const name = prompt('Enter a new display name:')
    if (!name || !uid) return

    await setDoc(doc(db, 'users', uid), { displayName: name }, { merge: true })
    setDisplayName(name)
    setDropdownOpen(false)
  }

  return (
    <div>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '200px', padding: '20px', borderRight: '1px solid #ccc' }}>
            <div onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', marginBottom: '10px' }}>
            Home
            </div>
            <div onClick={() => navigate('/market')} style={{ cursor: 'pointer', marginTop: '10px' }}>
            Market
            </div>
            <div onClick={() => navigate('/tournaments')} style={{ cursor: 'pointer' }}>
            Tournaments
            </div>
            <div onClick={() => navigate('/precon-league')} style={{ cursor: 'pointer', marginTop: '10px' }}>
            Precon League
            </div>
            <div onClick={() => navigate('/elo')} style={{ cursor: 'pointer', marginTop: '10px' }}>
            ELO
            </div>
        </div>

  <div style={{ flex: 1 }}>
    <div style={{ textAlign: 'right', padding: '10px 20px', position: 'relative' }}>
        <span
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{ cursor: 'pointer', fontWeight: 'bold' }}
        >
          Signed in as: {displayName || userEmail}
        </span>
        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: '30px',
              right: '20px',
              backgroundColor: '#f9f9f9',
              border: '1px solid #ccc',
              padding: '10px',
              borderRadius: '5px',
              zIndex: 1,
            }}
          >
            <div
              onClick={handleChangeDisplayName}
              style={{ padding: '5px 10px', cursor: 'pointer' }}
            >
              Change Display Name
            </div>

            <div
              onClick={handleLogout}
              style={{ padding: '5px 10px', cursor: 'pointer' }}
            >
              Logout
            </div>
          </div>
        )}
      </div>
    <h1 style={{ textAlign: 'center' }}>Welcome to the Dashboard</h1>
  </div>
</div>
    </div>
  )
}
