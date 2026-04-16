"use client"

import { useState, useTransition } from "react"
import { assignCourt } from "@/app/actions"

type Player = {
  id: string
  name: string
  preferredName?: string | null
  image?: string | null
  court?: number | null
}

const COURTS = [1, 2, 3, 4] as const

export default function CourtAssignments({
  players,
  isAdmin,
}: {
  players: Player[]
  isAdmin: boolean
}) {
  const [assignments, setAssignments] = useState<Record<string, number | null>>(
    Object.fromEntries(players.map((p) => [p.id, p.court ?? null]))
  )
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overZone, setOverZone] = useState<number | null | "unassigned">(null)
  const [, startTransition] = useTransition()

  function handleDrop(court: number | null) {
    if (!draggingId) return
    setAssignments((prev) => ({ ...prev, [draggingId]: court }))
    setDraggingId(null)
    setOverZone(null)
    startTransition(async () => {
      await assignCourt(draggingId, court)
    })
  }

  const inCourt = (n: number | null) =>
    players.filter((p) => (assignments[p.id] ?? null) === n)

  const zoneKey = (n: number | null) => (n === null ? "unassigned" : n)

  function courtZoneProps(court: number | null) {
    if (!isAdmin) return {}
    return {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault()
        setOverZone(zoneKey(court))
      },
      onDragLeave: () => setOverZone(null),
      onDrop: () => handleDrop(court),
    }
  }

  function playerDragProps(id: string) {
    if (!isAdmin) return {}
    return {
      draggable: true,
      onDragStart: () => setDraggingId(id),
      onDragEnd: () => { setDraggingId(null); setOverZone(null) },
    }
  }

  function PlayerCard({ player }: { player: Player }) {
    const displayName = player.preferredName || player.name.split(" ")[0]
    const isDragging = draggingId === player.id
    return (
      <div
        {...playerDragProps(player.id)}
        className={`flex items-center gap-2 py-1.5 rounded-lg px-1 transition-opacity ${
          isAdmin ? "cursor-grab active:cursor-grabbing" : ""
        } ${isDragging ? "opacity-30" : "opacity-100"}`}
      >
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-purple-900 flex items-center justify-center text-xs font-bold text-purple-200">
          {player.image ? (
            <img src={player.image} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            displayName[0].toUpperCase()
          )}
        </div>
        <span className="text-sm text-zinc-300 truncate">{displayName}</span>
      </div>
    )
  }

  function CourtColumn({ court }: { court: number | null }) {
    const assigned = inCourt(court)
    const isOver = overZone === zoneKey(court)
    const label = court === null ? "Unassigned" : `Court ${court}`

    return (
      <div
        {...courtZoneProps(court)}
        className={`rounded-xl border p-4 min-h-[120px] transition-colors ${
          court === null
            ? "bg-zinc-950 border-zinc-800"
            : "bg-zinc-900 border-zinc-800"
        } ${isOver ? "border-purple-500 bg-purple-950/30" : ""}`}
      >
        <div className="flex items-center gap-2 mb-3">
          {court !== null && (
            <div className="w-6 h-6 rounded-full bg-purple-900 flex items-center justify-center text-xs font-bold text-purple-300">
              {court}
            </div>
          )}
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className="ml-auto text-xs text-zinc-600">{assigned.length}</span>
        </div>

        <div className="space-y-0.5 min-h-[32px]">
          {assigned.length === 0 ? (
            <p className={`text-xs italic pt-2 text-center ${isOver ? "text-purple-400" : "text-zinc-700"}`}>
              {isOver ? "Drop here" : "Empty"}
            </p>
          ) : (
            assigned.map((p) => <PlayerCard key={p.id} player={p} />)
          )}
          {isOver && assigned.length > 0 && (
            <div className="h-8 rounded-lg border-2 border-dashed border-purple-500/50 mt-1" />
          )}
        </div>
      </div>
    )
  }

  const unassignedCount = inCourt(null).length

  return (
    <div className="px-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-bold text-white mb-1">Court Assignments</h2>
        <p className="text-zinc-500 text-sm mb-6">
          {isAdmin ? "Drag players between courts to assign them." : "See which court you're on."}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {COURTS.map((n) => <CourtColumn key={n} court={n} />)}
        </div>

        {unassignedCount > 0 && <CourtColumn court={null} />}
      </div>
    </div>
  )
}
