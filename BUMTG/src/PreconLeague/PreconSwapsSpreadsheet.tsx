import { useParams } from 'react-router-dom'
import { useState } from 'react'

export default function PreconSwapsSpreadsheet() {
  const { _, uid } = useParams()
  const [weeks, setWeeks] = useState([
    { date: '2025-07-14', values: ['', '', '', '', ''] },
    { date: '2025-07-21', values: ['', '', '', '', ''] },
    { date: '2025-07-28', values: ['', '', '', '', ''] },
  ])

  const handleChange = (weekIndex: number, fieldIndex: number, newValue: string) => {
    const updated = [...weeks]
    updated[weekIndex].values[fieldIndex] = newValue
    setWeeks(updated)
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Swaps for {uid}</h2>
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} style={{ marginBottom: '20px' }}>
          <strong>{week.date}</strong>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {week.values.map((value, fieldIndex) => (
              <input
                key={fieldIndex}
                type="text"
                value={value}
                onChange={(e) =>
                  handleChange(weekIndex, fieldIndex, e.target.value)
                }
                style={{ width: '120px' }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
