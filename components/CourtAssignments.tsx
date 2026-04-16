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

function PlayerCard({
  player,
  court,
  isAdmin,
  onAssign,
}: {
  player: Player
  court: number | null
  isAdmin: boolean
  onAssign: (id: string, court: number | null) => void
}) {
  const displayName = player.preferredName || player.name.split(" ")[0]

  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-purple-900 flex items-center justify-center text-xs font-bold text-purple-200">
        {player.image ? (
          <img src={player.image} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          displayName[0].toUpperCase()
        )}
      </div>
      <span className="text-sm text-zinc-300 flex-1 truncate">{displayName}</span>
      {isAdmin && (
        <select
          value={court ?? ""}
          onChange={(e) => {
            const val = e.target.value
            onAssign(player.id, val === "" ? null : Number(val))
          }}
          className="text-xs bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-zinc-300 focus:outline-none focus:border-purple-500"
        >
          <option value="">—</option>
          <option value="1">Court 1</option>
          <option value="2">Court 2</option>
          <option value="3">Court 3</option>
          <option value="4">Court 4</option>
        </select>
      )}
    </div>
  )
}

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
  const [, startTransition] = useTransition()

  function handleAssign(playerId: string, court: number | null) {
    setAssignments((prev) => ({ ...prev, [playerId]: court }))
    startTransition(async () => {
      await assignCourt(playerId, court)
    })
  }

  const inCourt = (n: number | null) =>
    players.filter((p) => (assignments[p.id] ?? null) === n)

  const courts = [1, 2, 3, 4] as const

  return (
    <div className="px-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-bold text-white mb-1">Court Assignments</h2>
        <p className="text-zinc-500 text-sm mb-6">
          {isAdmin ? "Drag players between courts using the dropdown." : "See which court you're on."}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {courts.map((n) => {
            const assigned = inCourt(n)
            return (
              <div key={n} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-purple-900 flex items-center justify-center text-xs font-bold text-purple-300">
                    {n}
                  </div>
                  <span className="text-sm font-semibold text-white">Court {n}</span>
                  <span className="ml-auto text-xs text-zinc-600">{assigned.length}</span>
                </div>
                {assigned.length === 0 ? (
                  <p className="text-xs text-zinc-700 italic">No players</p>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {assigned.map((p) => (
                      <PlayerCard
                        key={p.id}
                        player={p}
                        court={assignments[p.id] ?? null}
                        isAdmin={isAdmin}
                        onAssign={handleAssign}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Unassigned */}
        {inCourt(null).length > 0 && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <span className="text-sm font-semibold text-zinc-500 mb-3 block">
              Unassigned ({inCourt(null).length})
            </span>
            <div className="divide-y divide-zinc-800">
              {inCourt(null).map((p) => (
                <PlayerCard
                  key={p.id}
                  player={p}
                  court={null}
                  isAdmin={isAdmin}
                  onAssign={handleAssign}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
