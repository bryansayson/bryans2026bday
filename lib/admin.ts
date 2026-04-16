export const ADMIN_EMAIL = "bryansayson23@gmail.com"

export function isAdmin(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}
