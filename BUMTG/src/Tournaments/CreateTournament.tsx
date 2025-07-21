import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'
import { collection, addDoc, Timestamp } from 'firebase/firestore'

export default function CreateTournament() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [format, setFormat] = useState<'swiss' | 'draft' | ''>('') // <-- New state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const user = auth.currentUser
    if (!user || !format) return // Ensure format is selected

    const datetime = new Date(`${date}T${time}`)

    await addDoc(collection(db, 'tournaments'), {
      name,
      startTime: Timestamp.fromDate(datetime),
      creatorUid: user.uid,
      format, // <-- Save format
    })

    navigate('/tournaments')
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
      <h2>Create Tournament</h2>

      <div>
        <label>Name:</label><br />
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div>
        <label>Date:</label><br />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div>
        <label>Start Time:</label><br />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
      </div>

      <div style={{ marginTop: '10px' }}>
        <label>Tournament Format:</label><br />
        <label>
          <input
            type="radio"
            value="swiss"
            checked={format === 'swiss'}
            onChange={() => setFormat('swiss')}
            required
          />
          Swiss
        </label>
        <br />
        <label>
          <input
            type="radio"
            value="draft"
            checked={format === 'draft'}
            onChange={() => setFormat('draft')}
            required
          />
          Draft
        </label>
      </div>

      <button type="submit" style={{ marginTop: '10px' }}>Create</button>
      <button onClick={() => navigate('/tournaments')}>Cancel</button>
    </form>
  )
}
