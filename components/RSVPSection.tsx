"use client"

import { Session } from "next-auth"
import { signIn } from "next-auth/react"
import { addRSVP, removeRSVP } from "@/app/actions"
import { useState, useTransition } from "react"

interface Props {
  session: Session | null
  isAlreadyRSVPd: boolean
  inviteToken: string
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export default function RSVPSection({
  session,
  isAlreadyRSVPd,
  inviteToken,
}: Props) {
  const [rsvpd, setRsvpd] = useState(isAlreadyRSVPd)
  const [isPending, startTransition] = useTransition()
  const firstName = session?.user?.name?.split(" ")[0]

  const handleRSVP = () => {
    startTransition(async () => {
      await addRSVP(inviteToken)
      setRsvpd(true)
    })
  }

  const handleRemove = () => {
    startTransition(async () => {
      await removeRSVP()
      setRsvpd(false)
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pb-10">
      <div
        className={`rounded-2xl border p-5 transition-colors ${
          rsvpd
            ? "border-green-200 bg-green-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        {!session ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">You&apos;re invited!</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Sign in with Google to confirm your spot.
              </p>
            </div>
            <button
              onClick={() =>
                signIn("google", { callbackUrl: `/?invite=${inviteToken}` })
              }
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap"
            >
              <GoogleIcon />
              Sign in with Google
            </button>
          </div>
        ) : rsvpd ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">
                You&apos;re in, {firstName}!
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                See you on the court May 23rd.
              </p>
            </div>
            <button
              onClick={handleRemove}
              disabled={isPending}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
            >
              Can&apos;t make it? Remove RSVP
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">
                You&apos;re invited, {firstName}!
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                Lock in your spot for the tournament.
              </p>
            </div>
            <button
              onClick={handleRSVP}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-5 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isPending ? "Saving..." : "Count me in"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
