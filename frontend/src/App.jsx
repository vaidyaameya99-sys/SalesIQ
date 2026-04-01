import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/ui/Layout'
import Landing      from './pages/Landing'
import Upload       from './pages/Upload'
import Processing   from './pages/Processing'
import Results      from './pages/Results'
import History      from './pages/History'
import KnowledgeBase from './pages/KnowledgeBase'
import Settings     from './pages/Settings'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route element={<Layout />}>
          <Route path="/upload"              element={<Upload />} />
          <Route path="/processing/:callId"  element={<Processing />} />
          <Route path="/results/:callId"     element={<Results />} />
          <Route path="/history"             element={<History />} />
          <Route path="/knowledge"           element={<KnowledgeBase />} />
          <Route path="/settings"            element={<Settings />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
