import { supabase } from './supabase'

const BUCKET = 'progress-photos'

/**
 * Upload a compressed image (data URL) to Supabase Storage.
 * Returns the public URL, or null on failure.
 */
export const uploadProgressPhoto = async (
  userId: string,
  photoId: string,
  dataUrl: string,
): Promise<string | null> => {
  try {
    // Convert data URL → Blob
    const res = await fetch(dataUrl)
    const blob = await res.blob()

    const path = `${userId}/${photoId}.jpg`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: 'image/jpeg', upsert: true })

    if (error) {
      console.error('Photo upload error:', error.message)
      return null
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  } catch (e) {
    console.error('Photo upload failed:', e)
    return null
  }
}

/**
 * Delete a progress photo from Supabase Storage by its public URL.
 */
export const deleteProgressPhoto = async (userId: string, photoId: string): Promise<void> => {
  const path = `${userId}/${photoId}.jpg`
  await supabase.storage.from(BUCKET).remove([path])
}
