import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router"
import { LandingRoute } from "@/routes/landing-route"
import { RoomRoute } from "@/routes/room-route"
import { RoomsRoute } from "@/routes/rooms-route"

/** Old links used /r/<room>. Keep them working. */
function LegacyRoomRedirect() {
  const params = useParams<{ roomId: string }>()
  return <Navigate to={`/rooms/${params.roomId ?? "demo"}`} replace />
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/rooms" element={<RoomsRoute />} />
        <Route path="/rooms/:roomId" element={<RoomRoute />} />
        <Route path="/r/:roomId" element={<LegacyRoomRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
