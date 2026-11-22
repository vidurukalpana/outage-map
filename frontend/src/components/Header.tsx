import { NavLink } from 'react-router'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-gray-900 text-white' : 'text-gray-700'}`

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-2">
      <NavLink to="/" className="flex items-center gap-2 text-lg font-bold">
        <img src="/logo.svg" alt="" className="size-7" />
        OutageMap
      </NavLink>
      <nav className="flex gap-1">
        <NavLink to="/" end className={linkClass}>
          Live map
        </NavLink>
        <NavLink to="/history" className={linkClass}>
          History
        </NavLink>
      </nav>
    </header>
  )
}
