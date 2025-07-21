import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from './firebase'
import UserDropdown from './UserDropdown'


export default function Dashboard() {
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/')
      }
    })

    return () => unsubscribe()
  }, [navigate])

  return (
  <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
    {/* Sidebar */}
    <div
      style={{
        width: '200px',
        padding: '20px',
        borderRight: '2px solid #ccc',
        backgroundColor: '#fff',
      }}
    >
      <div onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', marginBottom: '10px' }}>
        Home
      </div>
      <div onClick={() => navigate('/market')} style={{ cursor: 'pointer', marginBottom: '10px' }}>
        Market
      </div>
      <div onClick={() => navigate('/tournaments')} style={{ cursor: 'pointer', marginBottom: '10px' }}>
        Tournaments
      </div>
      <div onClick={() => navigate('/precon-league')} style={{ cursor: 'pointer', marginBottom: '10px' }}>
        Precon League
      </div>
      <div onClick={() => navigate('/elo')} style={{ cursor: 'pointer' }}>
        ELO
      </div>
    </div>

    {/* Main content area */}
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
      }}
    >
      {/* Top-right dropdown */}
        <UserDropdown />

      {/* Centered content */}
      <h1 style={{ fontSize: '2.5rem', color: '#222' }}>Welcome to the Dashboard</h1>
    </div>
  </div>
)


}
