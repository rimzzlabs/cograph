import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { RoomRoute } from "@/routes/room-route"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/r/demo" replace />} />
        <Route path="/r/:roomId" element={<RoomRoute />} />
        <Route path="*" element={<Navigate to="/r/demo" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
