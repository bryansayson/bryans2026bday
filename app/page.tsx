import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import RSVPSection from "@/components/RSVPSection"
import Image from "next/image"

const AVATAR_COLORS = [
  "bg-green-100 text-green-700",
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-purple-100 text-purple-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
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

  const rsvps = await prisma.rSVP.findMany({
    orderBy: { createdAt: "asc" },
  })

  const isAlreadyRSVPd = session?.user?.email
    ? rsvps.some((r) => r.email === session.user!.email)
    : false

  return (
    <main className="min-h-screen bg-white">
      {/* Top accent bar */}
      <div className="h-1 bg-green-500" />

      {/* Header */}
      <div className="max-w-2xl mx-auto px-6 pt-14 pb-10">
        <div className="text-4xl mb-5">🏓</div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-none">
          Bryan&apos;s Birthday
          <br />
          Open Play
        </h1>
        <p className="mt-3 text-base font-medium text-gray-500 uppercase tracking-widest text-sm">
          Pickleball Tournament
        </p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
          <span>📅 May 23, 2025</span>
          <span>📍 Scholl Canyon, Glendale — Courts TBD</span>
        </div>

        {/* RSVP deadline callout */}
        <div className="mt-6 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
          <span className="text-amber-600 text-sm font-semibold">
            RSVP by May 15th
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="border-t border-gray-100" />
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
      <div className="max-w-2xl mx-auto px-6 py-8 pb-20">
        <div className="flex items-baseline gap-2 mb-8">
          <span className="text-3xl font-extrabold text-gray-900">
            {rsvps.length}
          </span>
          <span className="text-gray-400 font-medium">
            {rsvps.length === 1 ? "player" : "players"} confirmed
          </span>
          {rsvps.length > 0 && (
            <span className="ml-1 inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          )}
        </div>

        {rsvps.length === 0 ? (
          <p className="text-gray-300 text-sm">
            No players yet — be the first to lock in your spot.
          </p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-6">
            {rsvps.map((rsvp) => {
              const colorClass = getAvatarColor(rsvp.name)
              return (
                <div
                  key={rsvp.id}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
                    {rsvp.image ? (
                      <Image
                        src={rsvp.image}
                        alt={rsvp.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center font-bold text-xl ${colorClass}`}
                      >
                        {rsvp.name[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 font-medium text-center leading-tight max-w-full truncate">
                    {rsvp.name.split(" ")[0]}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-50 py-6 text-center text-xs text-gray-300">
        Bryan&apos;s Birthday Open Play · May 23, 2025
      </div>
    </main>
  )
}
