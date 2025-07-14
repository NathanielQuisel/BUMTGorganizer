import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from './firebase'
import { collection, addDoc, Timestamp } from 'firebase/firestore'

export default function CreatePreconLeague() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')

  const handleCreate = async () => {
    const user = auth.currentUser
    if (!name || !startDate || !user) {
      alert('Please fill out all fields.')
      return
    }
    
    

    try {
      await addDoc(collection(db, 'preconLeagues'), {
        name,
        startDate: Timestamp.fromDate(new Date(startDate)),
        creatorUid: user.uid
      })
      navigate('/precon-league') // back to league list
    } catch (error) {
      alert('Failed to create league: ' + (error as Error).message)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Create Precon League</h2>
      <div style={{ marginBottom: '10px' }}>
        <label>League Name:</label><br />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Start Date:</label><br />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <button onClick={handleCreate}>Confirm</button>
      <button onClick={() => navigate('/precon-league')}>Cancel</button>
    </div>
  )
}
