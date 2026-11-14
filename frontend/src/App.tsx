import { Route, Routes } from 'react-router'
import HistoryPage from './pages/HistoryPage'
import LivePage from './pages/LivePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LivePage />} />
      <Route path="/history" element={<HistoryPage />} />
    </Routes>
  )
}
