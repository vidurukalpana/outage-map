import { Route, Routes } from 'react-router'
import Header from './components/Header'
import HistoryPage from './pages/HistoryPage'
import LivePage from './pages/LivePage'

export default function App() {
  return (
    <div className="flex h-dvh flex-col">
      <Header />
      <div className="min-h-0 flex-1">
        <Routes>
          <Route path="/" element={<LivePage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </div>
    </div>
  )
}
