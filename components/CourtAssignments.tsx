"use client"

import { useState, useTransition } from "react"
import { assignCourt, createMatch, deleteMatch } from "@/app/actions"

type Player = {
  id: string
  name: string
  preferredName?: string | null
  image?: string | null
  court?: number | null
}

type Match = {
  id: string
  court: number
  round: number
  team1p1: string
  team1p2: string
  team2p1: string
  team2p2: string
}

const COURTS = [1, 2, 3, 4] as const

const BLANK_FORM = { round: 1, team1p1: "", team1p2: "", team2p1: "", team2p2: "" }

export default function CourtAssignments({
  players,
  matches: initialMatches,
  isAdmin,
}: {
  players: Player[]
  matches: Match[]
  isAdmin: boolean
}) {
  const [assignments, setAssignments] = useState<Record<string, number | null>>(
    Object.fromEntries(players.map((p) => [p.id, p.court ?? null]))
  )
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overZone, setOverZone] = useState<number | null | "unassigned">(null)
  const [addingMatchFor, setAddingMatchFor] = useState<number | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
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

  function handleAddMatch(court: number) {
    if (!form.team1p1 || !form.team1p2 || !form.team2p1 || !form.team2p2) return
    const optimistic: Match = {
      id: `temp-${Date.now()}`,
      court,
      round: form.round,
      team1p1: form.team1p1,
      team1p2: form.team1p2,
      team2p1: form.team2p1,
      team2p2: form.team2p2,
    }
    setMatches((prev) => [...prev, optimistic])
    setAddingMatchFor(null)
    setForm(BLANK_FORM)
    startTransition(async () => {
      const saved = await createMatch(court, form.round, form.team1p1, form.team1p2, form.team2p1, form.team2p2)
      // replace optimistic entry once saved (revalidatePath will refresh server data on next nav)
      void saved
    })
  }

  function handleDeleteMatch(id: string) {
    setMatches((prev) => prev.filter((m) => m.id !== id))
    startTransition(async () => {
      await deleteMatch(id)
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

  function playerName(id: string) {
    const p = players.find((x) => x.id === id)
    if (!p) return "?"
    return p.preferredName || p.name.split(" ")[0]
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

  function AddMatchForm({ court }: { court: number }) {
    const opts = players.map((p) => ({
      id: p.id,
      label: p.preferredName || p.name.split(" ")[0],
    }))

    return (
      <div className="mt-2 p-3 rounded-lg bg-zinc-800 border border-zinc-700 space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400 w-12 flex-shrink-0">Round</label>
          <input
            type="number"
            min={1}
            value={form.round}
            onChange={(e) => setForm((f) => ({ ...f, round: Number(e.target.value) }))}
            className="w-14 text-xs bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-xs text-purple-400 font-semibold">Team 1</p>
            {(["team1p1", "team1p2"] as const).map((key) => (
              <select
                key={key}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full text-xs bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white"
              >
                <option value="">Pick player…</option>
                {opts.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            ))}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 font-semibold">Team 2</p>
            {(["team2p1", "team2p2"] as const).map((key) => (
              <select
                key={key}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full text-xs bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white"
              >
                <option value="">Pick player…</option>
                {opts.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => handleAddMatch(court)}
            disabled={!form.team1p1 || !form.team1p2 || !form.team2p1 || !form.team2p2}
            className="flex-1 text-xs bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded px-3 py-1.5 transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => { setAddingMatchFor(null); setForm(BLANK_FORM) }}
            className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1.5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  function CourtColumn({ court }: { court: number | null }) {
    const assigned = inCourt(court)
    const isOver = overZone === zoneKey(court)
    const label = court === null ? "Unassigned" : `Court ${court}`
    const courtMatches = court !== null
      ? [...matches.filter((m) => m.court === court)].sort((a, b) => a.round - b.round)
      : []

    return (
      <div
        {...courtZoneProps(court)}
        className={`rounded-xl border p-4 transition-colors ${
          court === null
            ? "bg-zinc-950 border-zinc-800"
            : "bg-zinc-900 border-zinc-800"
        } ${isOver ? "border-purple-500 bg-purple-950/30" : ""}`}
      >
        {/* Court header */}
        <div className="flex items-center gap-2 mb-3">
          {court !== null && (
            <div className="w-6 h-6 rounded-full bg-purple-900 flex items-center justify-center text-xs font-bold text-purple-300">
              {court}
            </div>
          )}
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className="ml-auto text-xs text-zinc-600">{assigned.length}</span>
        </div>

        {/* Players */}
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

        {/* Match schedule */}
        {court !== null && (
          <div className="mt-4 pt-3 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Schedule</span>
              {isAdmin && addingMatchFor !== court && (
                <button
                  onClick={() => { setAddingMatchFor(court); setForm(BLANK_FORM) }}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                >
                  + Add
                </button>
              )}
            </div>

            {courtMatches.length === 0 && addingMatchFor !== court && (
              <p className="text-xs text-zinc-700 italic">No matches yet</p>
            )}

            <div className="space-y-1.5">
              {courtMatches.map((m) => (
                <div key={m.id} className="flex items-start gap-1.5 group">
                  <span className="text-xs text-zinc-600 font-mono w-5 flex-shrink-0 pt-0.5">R{m.round}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-purple-300 font-medium">{playerName(m.team1p1)} & {playerName(m.team1p2)}</span>
                    <span className="text-xs text-zinc-600 mx-1">vs</span>
                    <span className="text-xs text-zinc-300 font-medium">{playerName(m.team2p1)} & {playerName(m.team2p2)}</span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteMatch(m.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all text-xs leading-none flex-shrink-0 pt-0.5"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isAdmin && addingMatchFor === court && <AddMatchForm court={court} />}
          </div>
        )}
      </div>
    )
  }

  const unassignedCount = inCourt(null).length

  return (
    <div className="px-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-bold text-white mb-1">Court Assignments (NOT FINAL until RSVP window is closed)</h2>
        <p className="text-zinc-500 text-sm mb-6">
          {isAdmin ? "Drag players between courts to assign them." : "See which court you're on."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {COURTS.map((n) => <CourtColumn key={n} court={n} />)}
        </div>

        {unassignedCount > 0 && <CourtColumn court={null} />}
      </div>
    </div>
  )
}
