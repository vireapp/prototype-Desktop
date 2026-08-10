/**
 * write-queue.ts
 *
 * A persistent write queue for Supabase operations.
 * - Stores pending writes in localStorage so they survive page refreshes.
 * - Flushes every FLUSH_INTERVAL_MS automatically.
 * - Flushes immediately when the network comes back online.
 * - Retries up to MAX_RETRIES times with exponential back-off before dropping.
 */

import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type WriteOp = 'insert' | 'upsert' | 'update'

interface PendingWrite {
  id: string
  table: string
  op: WriteOp
  payload: Record<string, unknown>
  /** Required when op === 'update' */
  filter?: { column: string; value: string }
  retries: number
  createdAt: number
}

// ─── Config ───────────────────────────────────────────────────────────────────

const QUEUE_KEY = 'vire_write_queue_v1'
const MAX_RETRIES = 4
const FLUSH_INTERVAL_MS = 6_000 // flush every 6 s
const MAX_QUEUE_AGE_MS = 24 * 60 * 60 * 1_000 // drop writes older than 24 h

// ─── Queue Storage ────────────────────────────────────────────────────────────

function loadQueue(): PendingWrite[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    const parsed: PendingWrite[] = JSON.parse(raw)
    // Prune very old entries that will never succeed
    return parsed.filter((w) => Date.now() - w.createdAt < MAX_QUEUE_AGE_MS)
  } catch {
    return []
  }
}

function saveQueue(queue: PendingWrite[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // localStorage full — nothing we can do, log quietly
    console.warn('[WriteQueue] localStorage full, could not persist queue.')
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Add a write to the persistent queue.
 * It will be sent to Supabase as soon as possible (within FLUSH_INTERVAL_MS).
 */
export function enqueueWrite(
  write: Omit<PendingWrite, 'id' | 'retries' | 'createdAt'>
): void {
  const queue = loadQueue()
  queue.push({
    ...write,
    id: crypto.randomUUID(),
    retries: 0,
    createdAt: Date.now()
  })
  saveQueue(queue)
}

/**
 * Returns the number of pending writes waiting to be flushed.
 * Useful for debug overlays.
 */
export function pendingWriteCount(): number {
  return loadQueue().length
}

// ─── Flush Logic ──────────────────────────────────────────────────────────────

let isFlushing = false

async function flushQueue(): Promise<void> {
  if (isFlushing) return
  isFlushing = true

  const queue = loadQueue()
  if (queue.length === 0) {
    isFlushing = false
    return
  }

  const supabase = createClient()
  const remaining: PendingWrite[] = []

  for (const write of queue) {
    try {
      if (write.op === 'insert') {
        const { error } = await supabase.from(write.table).insert(write.payload)
        if (error) throw error
      } else if (write.op === 'upsert') {
        const { error } = await supabase.from(write.table).upsert(write.payload)
        if (error) throw error
      } else if (write.op === 'update') {
        if (!write.filter) {
          console.error('[WriteQueue] update op missing filter, dropping write:', write)
          continue
        }
        const { error } = await supabase
          .from(write.table)
          .update(write.payload)
          .eq(write.filter.column, write.filter.value)
        if (error) throw error
      }
      // ✅ Success — not added to remaining
    } catch (err) {
      const nextRetry = write.retries + 1
      if (nextRetry <= MAX_RETRIES) {
        remaining.push({ ...write, retries: nextRetry })
      } else {
        console.error(
          `[WriteQueue] Permanently dropping write to "${write.table}" after ${MAX_RETRIES} retries.`,
          write,
          err
        )
      }
    }
  }

  saveQueue(remaining)
  isFlushing = false
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

/**
 * Call this ONCE at app startup (e.g. in main.tsx) to start the background flusher.
 */
export function startWriteQueue(): void {
  // Flush immediately on startup to catch any writes from a previous session
  flushQueue()

  // Periodic flush
  setInterval(flushQueue, FLUSH_INTERVAL_MS)

  // Flush as soon as network comes back
  window.addEventListener('online', () => {
    console.log('[WriteQueue] Network restored — flushing queue.')
    flushQueue()
  })
}
