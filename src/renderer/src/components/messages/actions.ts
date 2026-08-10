/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/client'

export async function sendMessage(
  formData: FormData
): Promise<{ error?: string; success?: boolean; duplicate?: boolean }> {
  const receiverId = formData.get('receiverId') as string
  const content = formData.get('content') as string
  const id = formData.get('id') as string // Client generated ID

  if (!receiverId || !content) return { error: 'Missing required fields' }

  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Not authenticated' }

  const { error: insertError } = await supabase.from('direct_messages').insert({
    id: id || undefined, // Use provided ID if available
    sender_id: user.id,
    receiver_id: receiverId,
    content: content.trim()
  })

  if (insertError) {
    if (insertError.code === '23505') {
      // Unique constraint violation (duplicate ID)
      // This is good! It means we prevented a duplicate.
      return { success: true, duplicate: true }
    }
    console.error('Send message error:', insertError)
    return { error: 'Failed to send message' }
  }

  return { success: true }
}

export async function deleteMessage(
  messageId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Not authenticated' }

  console.log('Deleting message:', messageId, 'User:', user.id)

  const { error: deleteError } = await supabase
    .from('direct_messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', user.id) // Only allow deleting own messages

  if (deleteError) {
    console.error('Delete message error:', deleteError)
    return { error: 'Failed to delete message' }
  }

  return { success: true }
}

export async function editMessage(
  messageId: string,
  content: string,
  isTextEdit: boolean = false
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Not authenticated' }

  const { data: msg } = await supabase
    .from("direct_messages")
    .select("sender_id, receiver_id")
    .eq("id", messageId)
    .single();

  if (!msg) return { error: "Not found" };

  if (msg.sender_id !== user.id && msg.receiver_id !== user.id) {
    return { error: "Unauthorized" };
  }

  const updatePayload: any = { content: content.trim() };
  if (isTextEdit && msg.sender_id === user.id) {
    updatePayload.is_edited = true;
  }

  const { error: updateError } = await supabase
    .from('direct_messages')
    .update(updatePayload)
    .eq('id', messageId)

  if (updateError) {
    console.error('Edit message error:', updateError)
    return { error: 'Failed to edit message' }
  }

  return { success: true }
}

export async function getConversations(): Promise<any[]> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return []

  const { data: acceptedRequests } = await supabase
    .from('friend_requests')
    .select(
      `
            sender:sender_id(*), 
            receiver:receiver_id(*)
        `
    )
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq('status', 'accepted')

  const conversations =
    acceptedRequests?.map((req: any) => {
      const isSender = req.sender.id === user.id
      const profile = isSender ? req.receiver : req.sender
      return {
        userId: profile.id,
        profile: profile,
        lastMessage: null // We could fetch this if needed
      }
    }) || []

  return conversations
}

export async function getMessages(otherUserId: string): Promise<any[]> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return []

  const { data: messages, error: fetchError } = await supabase
    .from('direct_messages')
    .select('*')
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true })

  if (fetchError) {
    console.error('Fetch messages error:', fetchError)
    return []
  }
  return messages
}

export async function fetchLinkMetadata(url: string) {
  try {
    const data = await window.electron.ipcRenderer.invoke('fetch-link-metadata', url);
    return data;
  } catch (error) {
    console.error("Link preview error:", error);
    return null;
  }
}

export async function uploadAudio(formData: FormData) {
  const supabase = createClient();
  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  const fileName = `${crypto.randomUUID()}.webm`;

  const { error } = await supabase.storage
    .from("audio-messages")
    .upload(fileName, file, {
      contentType: "audio/webm",
    });

  if (error) {
    console.error("Audio upload error:", error);
    return { error: "Failed to upload audio" };
  }

  const { data: publicUrlData } = supabase.storage
    .from("audio-messages")
    .getPublicUrl(fileName);

  return { url: publicUrlData.publicUrl };
}

export async function uploadImage(formData: FormData) {
  const supabase = createClient();
  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  if (file.size > 200 * 1024) {
    return { error: "Large uploads (>200KB) are only available for premium users (Coming Soon!)" };
  }

  const fileName = `images/${crypto.randomUUID()}-${file.name}`;

  const { error } = await supabase.storage
    .from("audio-messages")
    .upload(fileName, file, {
      contentType: file.type,
    });

  if (error) {
    console.error("Image upload error:", error);
    return { error: "Failed to upload image" };
  }

  const { data: publicUrlData } = supabase.storage
    .from("audio-messages")
    .getPublicUrl(fileName);

  return { url: publicUrlData.publicUrl };
}
