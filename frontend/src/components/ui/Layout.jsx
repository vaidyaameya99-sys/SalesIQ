import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-dark-900 bg-grid-dark">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  )
}
