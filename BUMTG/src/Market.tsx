import { useNavigate } from 'react-router-dom'

export default function Market() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Market</h2>
        <button onClick={() => navigate('/dashboard')}>Home</button>
     </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button onClick={() => console.log('Setup trades clicked')}>
          Setup Trades
        </button>

      </div>
    </div>
  )
}
