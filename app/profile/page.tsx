import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ProfileForm from "@/components/ProfileForm"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  const back = (
    <a
      href="/"
      className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-sm mb-10 transition-colors"
    >
      ← Back to event
    </a>
  )

  if (!session?.user?.email) {
    return (
      <main className="min-h-screen bg-black">
        <div className="h-1 bg-purple-600" />
        <div className="max-w-md mx-auto px-6 pt-12 pb-16">
          {back}
          <h1 className="text-2xl font-extrabold text-white mb-2">Your Profile</h1>
          <p className="text-zinc-400 text-sm mt-4">
            Sign in with Google to edit your profile.
          </p>
          <a
            href="/api/auth/signin"
            className="mt-6 inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
          >
            Sign in with Google
          </a>
        </div>
      </main>
    )
  }

  const rsvp = await prisma.rSVP.findUnique({
    where: { email: session.user.email },
  })

  if (!rsvp) {
    return (
      <main className="min-h-screen bg-black">
        <div className="h-1 bg-purple-600" />
        <div className="max-w-md mx-auto px-6 pt-12 pb-16">
          {back}
          <h1 className="text-2xl font-extrabold text-white mb-2">Your Profile</h1>
          <p className="text-zinc-400 text-sm mt-4">
            You need to RSVP before you can set up your profile.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="h-1 bg-purple-600" />
      <div className="max-w-md mx-auto px-6 pt-12 pb-16">
        {back}
        <h1 className="text-2xl font-extrabold text-white mb-2">Your Profile</h1>
        <p className="text-zinc-500 text-sm mb-8">
          Update how you appear on the player list.
        </p>
        <ProfileForm
          currentName={rsvp.preferredName || rsvp.name}
          currentImage={rsvp.image ?? null}
          googleImage={session.user.image ?? null}
        />
      </div>
    </main>
  )
}
