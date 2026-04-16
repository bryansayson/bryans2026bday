import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/admin"
import { adminRemoveRSVP } from "@/app/actions"
import RSVPSection from "@/components/RSVPSection"
import CourtAssignments from "@/components/CourtAssignments"
import Image from "next/image"

const AVATAR_COLORS = [
  "bg-purple-900 text-purple-300",
  "bg-violet-900 text-violet-300",
  "bg-fuchsia-900 text-fuchsia-300",
  "bg-indigo-900 text-indigo-300",
  "bg-purple-800 text-purple-200",
  "bg-violet-800 text-violet-200",
  "bg-fuchsia-800 text-fuchsia-200",
  "bg-indigo-800 text-indigo-200",
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % AVATAR_COLORS.length
  }
  return AVATAR_COLORS[hash]
}

export default async function Home({
  searchParams,
}: {
  searchParams: { invite?: string | string[] }
}) {
  const session = await getServerSession(authOptions)

  const rawToken = searchParams.invite
  const inviteToken = Array.isArray(rawToken) ? rawToken[0] : rawToken
  const isInvited = !!inviteToken && inviteToken === process.env.INVITE_SECRET

  const [rsvps, matches] = await Promise.all([
    prisma.rSVP.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.match.findMany({ orderBy: [{ court: "asc" }, { round: "asc" }] }),
  ])

  const myEmail = session?.user?.email?.toLowerCase() ?? null
  const myRsvp = myEmail ? rsvps.find((r) => r.email.toLowerCase() === myEmail) ?? null : null
  const isAlreadyRSVPd = myRsvp !== null
  const adminUser = isAdmin(session?.user?.email)

  return (
    <main className="min-h-screen bg-black">
      {/* Top accent bar */}
      <div className="h-1 bg-purple-600" />

      {/* Header */}
      <div className="max-w-2xl mx-auto px-6 pt-14 pb-10">
        <div className="text-4xl mb-5">🏓</div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-none">
          Bryan&apos;s Birthday
          <br />
          Open Play
        </h1>
        <p className="mt-3 text-base font-medium text-purple-400 uppercase tracking-widest text-sm">
          Pickleball Tournament
        </p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-base text-zinc-300 font-medium">
          <span>📅 May 23, 2025</span>
          <span>🕓 4–7 PM</span>
          <span className="text-white font-bold text-lg">📍 Scholl Canyon, Glendale — Courts TBD</span>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="inline-flex items-center gap-2 bg-purple-950 border border-purple-700 rounded-xl px-4 py-2">
            <span className="text-purple-300 text-sm font-semibold">
              RSVP by May 15th
            </span>
          </div>
          <a
            href="/profile"
            className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
          >
            ✏️ Edit Profile
          </a>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-zinc-800" />
      </div>

      {/* RSVP Section — only visible with invite link */}
      {isInvited && (
        <div className="pt-8">
          <RSVPSection
            session={session}
            isAlreadyRSVPd={isAlreadyRSVPd}
            inviteToken={inviteToken!}
          />
        </div>
      )}

      {/* Player Count + List */}
      <div className="px-6 py-8 pb-20">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {rsvps.length}
            </span>
            <span className="text-zinc-400 font-medium">
              {rsvps.length === 1 ? "player" : "players"} confirmed
            </span>
            {rsvps.length > 0 && (
              <span className="ml-1 inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            )}
          </div>
          <p className="text-white font-bold text-lg mt-2 text-center leading-snug">
            friendly but competitive rotating partners round robin tournament with medal rounds!
          </p>
        </div>

        {rsvps.length === 0 ? (
          <p className="text-zinc-600 text-sm">
            No players yet — be the first to lock in your spot.
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {rsvps.map((rsvp: typeof rsvps[number] & { preferredName?: string | null }) => {
              const colorClass = getAvatarColor(rsvp.name)
              const isMe = myRsvp !== null && rsvp.id === myRsvp.id
              const removeAction = adminRemoveRSVP.bind(null, rsvp.id)

              const card = (
                <div className="relative flex flex-col items-center gap-2">
                  {adminUser && !isMe && (
                    <form action={removeAction} className="absolute -top-1 -right-1 z-10">
                      <button
                        type="submit"
                        title="Remove player"
                        className="w-5 h-5 rounded-full bg-red-700 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center leading-none transition-colors"
                      >
                        ×
                      </button>
                    </form>
                  )}
                  <div className={`relative w-20 h-20 rounded-full overflow-hidden ring-2 shadow-sm transition-all ${isMe ? "ring-purple-500 group-hover:ring-purple-300" : "ring-purple-800"}`}>
                    {rsvp.image ? (
                      rsvp.image.startsWith("data:") ? (
                        <img src={rsvp.image} alt={rsvp.name} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <Image src={rsvp.image} alt={rsvp.name} fill className="object-cover" />
                      )
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center font-bold text-2xl ${colorClass}`}>
                        {rsvp.name[0].toUpperCase()}
                      </div>
                    )}
                    {isMe && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-semibold">Edit</span>
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium text-center leading-tight max-w-full truncate transition-colors ${isMe ? "text-purple-400 group-hover:text-purple-300" : "text-zinc-400"}`}>
                    {rsvp.preferredName ?? rsvp.name.split(" ")[0]}
                  </span>
                </div>
              )

              return isMe ? (
                <a key={rsvp.id} href="/profile" className="group">
                  {card}
                </a>
              ) : (
                <div key={rsvp.id}>{card}</div>
              )
            })}
          </div>
        )}
      </div>

      {/* Court Assignments */}
      {rsvps.length > 0 && (
        <>
          <div className="max-w-4xl mx-auto px-6 mb-8">
            <div className="border-t border-zinc-800" />
          </div>
          <CourtAssignments
            players={rsvps.map((r) => ({
              id: r.id,
              name: r.name,
              preferredName: r.preferredName,
              image: r.image,
              court: r.court,
            }))}
            matches={matches}
            isAdmin={adminUser}
          />
        </>
      )}

      {/* Footer */}
      <div className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-600">
        Bryan&apos;s Birthday Open Play · May 23, 2025
      </div>
    </main>
  )
}
