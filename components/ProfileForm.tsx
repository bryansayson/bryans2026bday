"use client"

import { useState, useRef } from "react"
import { updateProfile } from "@/app/actions"

export default function ProfileForm({
  currentName,
  currentImage,
  googleImage,
}: {
  currentName: string
  currentImage: string | null
  googleImage: string | null
}) {
  const [name, setName] = useState(currentName)
  // what's shown in the preview
  const [imagePreview, setImagePreview] = useState<string | null>(
    currentImage ?? googleImage
  )
  // only defined when the user has explicitly chosen a new image
  const [newImageData, setNewImageData] = useState<string | undefined>(undefined)
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const isUsingCustomImage =
    newImageData !== undefined ||
    (currentImage !== null && currentImage !== googleImage)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      const img = document.createElement("img")
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX = 400
        let w = img.width
        let h = img.height
        if (w > h) {
          h = Math.round((h * MAX) / w)
          w = MAX
        } else {
          w = Math.round((w * MAX) / h)
          h = MAX
        }
        canvas.width = w
        canvas.height = h
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
        const resized = canvas.toDataURL("image/jpeg", 0.85)
        setImagePreview(resized)
        setNewImageData(resized)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  function handleResetToGoogle() {
    setImagePreview(googleImage)
    // explicitly tell the server to reset to the Google image
    setNewImageData(googleImage ?? undefined)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setSuccess(false)
    try {
      await updateProfile(name, newImageData)
      setSuccess(true)
      setNewImageData(undefined)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="relative w-28 h-28 rounded-full overflow-hidden ring-2 ring-purple-700 cursor-pointer group"
          onClick={() => fileRef.current?.click()}
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-purple-900 flex items-center justify-center text-3xl font-bold text-purple-200">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-semibold">Change</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm text-purple-400 hover:text-purple-200 underline transition-colors"
          >
            Upload photo
          </button>
          {isUsingCustomImage && googleImage && (
            <>
              <span className="text-zinc-700">·</span>
              <button
                type="button"
                onClick={handleResetToGoogle}
                className="text-sm text-zinc-500 hover:text-zinc-300 underline transition-colors"
              >
                Use Google photo
              </button>
            </>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Display name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-400">
          Display name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setSuccess(false)
          }}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
          placeholder="Your name on the player list"
          required
        />
        <p className="text-xs text-zinc-600">
          This is what shows on your player card.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>

      {success && (
        <p className="text-green-400 text-sm text-center">Profile updated!</p>
      )}
    </form>
  )
}
