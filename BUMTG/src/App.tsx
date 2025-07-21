import { Routes, Route } from 'react-router-dom'
// import { signInWithPopup } from 'firebase/auth'
// import { auth, db, googleProvider } from './firebase'
// import { doc, getDoc, setDoc } from 'firebase/firestore'
import Dashboard from './Dashboard'
import Tournaments from './Tournaments/Tournaments'
import CreateTournament from './Tournaments/CreateTournament'
import TournamentRouter from './Tournaments/TournamentRouter'
import ELO from './ELO/ELO'
import PreconLeague from './PreconLeague/PreconLeague'
import CreatePreconLeague from './PreconLeague/CreatePreconLeague'
import PreconLeagueDetail from './PreconLeague/PreconLeagueDetail'
import Market from './Market/Market'
import PreconSwapsSpreadsheet from './PreconLeague/PreconSwapsSpreadsheet'
import HomePage from './HomePage'
import PastTournaments from './PastTournaments/PastTournaments'
import './Theme.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/tournaments" element={<Tournaments />} />
      <Route path="/create-tournament" element={<CreateTournament />} />
      <Route path="/tournament/:id" element={<TournamentRouter />} />
      <Route path="/elo" element={<ELO />} />
      <Route path="/precon-league" element={<PreconLeague />} />
      <Route path="/create-precon-league" element={<CreatePreconLeague />} />
      <Route path="/precon-league/:id" element={<PreconLeagueDetail />} />
      <Route path="/market" element={<Market />} />
      <Route path="/precon-league/:id/swaps/:uid" element={<PreconSwapsSpreadsheet />} />
      <Route path="/past-tournaments" element={<PastTournaments/>}/>
    </Routes>
  )
}
