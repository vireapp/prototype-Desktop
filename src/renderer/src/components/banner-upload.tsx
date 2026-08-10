import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

export function BannerUpload({
  value,
  onUploadComplete
}: {
  value?: string | null
  onUploadComplete: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const uploadBanner = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `banner_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage.from('banners').upload(filePath, file)

      if (uploadError) {
        const { error: fallbackError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file)

        if (fallbackError) throw fallbackError

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        onUploadComplete(data.publicUrl)
      } else {
        const { data } = supabase.storage.from('banners').getPublicUrl(filePath)
        onUploadComplete(data.publicUrl)
      }

      toast.success('Banner uploaded')
    } catch (error) {
      console.error(error)
      toast.error('Error uploading banner')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full h-full relative group">
      {!value && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-white/30 group-hover:text-white/60 transition-colors">
            <ImageIcon className="w-8 h-8" />
            <span className="text-xs uppercase tracking-widest font-medium">Upload Banner</span>
          </div>
        </div>
      )}

      {value && (
        <img
          src={value}
          alt="Banner"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}

      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
        {uploading ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : (
          <div className="flex items-center gap-2 text-white font-medium tracking-wide">
            <Upload className="w-4 h-4" />
            <span className="text-sm">CHANGE COVER</span>
          </div>
        )}
      </div>

      <Input
        type="file"
        accept="image/*"
        onChange={uploadBanner}
        disabled={uploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
    </div>
  )
}
