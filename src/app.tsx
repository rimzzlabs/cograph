import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { LandingRoute } from "@/routes/landing-route"
import { RoomRoute } from "@/routes/room-route"
import { RoomsRoute } from "@/routes/rooms-route"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/rooms" element={<RoomsRoute />} />
        <Route path="/r/:roomId" element={<RoomRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
