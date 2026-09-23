import { Routes, Route } from 'react-router-dom'
import Admin from './admin'

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<Admin />} />
    </Routes>
  )
}
