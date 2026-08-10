import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Label } from '@/components/ui/label'

export function AvatarUpload({
  value,
  onUploadComplete
}: {
  value?: string | null
  onUploadComplete: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

      onUploadComplete(data.publicUrl)
    } catch (error) {
      console.error(error)
      alert('Error uploading avatar')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full h-full relative group">
      <div className="w-full h-full rounded-full overflow-hidden relative bg-muted">
        <img
          src={value || '/placeholder-avatar.png'}
          alt="Avatar"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-[10px] uppercase tracking-widest text-white font-bold">Change</span>
        </div>
      </div>
      <Input
        type="file"
        accept="image/*"
        onChange={uploadAvatar}
        disabled={uploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
    </div>
  )
}
