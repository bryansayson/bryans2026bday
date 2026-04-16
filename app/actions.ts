"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function addRSVP(inviteToken: string, preferredName?: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    throw new Error("Not authenticated")
  }

  if (inviteToken !== process.env.INVITE_SECRET) {
    throw new Error("Invalid invite token")
  }

  await prisma.rSVP.upsert({
    where: { email: session.user.email },
    update: {
      preferredName: preferredName || null,
    },
    create: {
      name: session.user.name ?? "Unknown",
      email: session.user.email,
      image: session.user.image ?? null,
      preferredName: preferredName || null,
    },
  })

  revalidatePath("/")
}

export async function removeRSVP() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    throw new Error("Not authenticated")
  }

  await prisma.rSVP.delete({
    where: { email: session.user.email },
  })

  revalidatePath("/")
}
