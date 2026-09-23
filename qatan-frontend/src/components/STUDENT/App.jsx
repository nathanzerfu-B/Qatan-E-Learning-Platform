import { Routes, Route } from 'react-router-dom'
import Student from './student'

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<Student />} />
    </Routes>
  )
}
