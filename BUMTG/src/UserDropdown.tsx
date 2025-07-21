// src/components/UserDropdown.tsx
import { useState, useEffect } from 'react'
import { auth, db } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

export default function UserDropdown() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [uid, setUid] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserEmail(user.email)
        setUid(user.uid)

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

  const handleChangeDisplayName = async () => {
    const name = prompt('Enter a new display name:')
    if (!name || !uid) return

    await setDoc(doc(db, 'users', uid), { displayName: name }, { merge: true })
    setDisplayName(name)
    setDropdownOpen(false)
  }

  const handleLogout = async () => {
    await auth.signOut()
    navigate('/')
  }

  return (
    <div style={{ position: 'absolute', top: '15px', right: '30px' }}>
      <div
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{ cursor: 'pointer', fontWeight: 'bold' }}
      >
        Signed in as: {displayName || userEmail}
      </div>

      {dropdownOpen && (
        <div
          style={{
            marginTop: '5px',
            backgroundColor: '#f9f9f9',
            border: '1px solid #ccc',
            padding: '10px',
            borderRadius: '5px',
            zIndex: 1
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
  )
}
