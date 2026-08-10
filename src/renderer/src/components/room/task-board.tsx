'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

interface Task {
  id: string
  content: string
  columnId: 'todo' | 'inprogress' | 'done'
  assignedTo?: string
}

interface RoomTaskBoardProps {
  roomId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any
  onBack?: () => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function RoomTaskBoard({ roomId, user }: RoomTaskBoardProps): React.JSX.Element {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  const supabase = createClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Sync
  useEffect(() => {
    const channel = supabase
      .channel(`room_tasks:${roomId}`)
      .on('broadcast', { event: 'tasks_update' }, ({ payload }) => {
        if (payload.userId !== user.id) {
          setTasks(payload.tasks)
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, user.id, supabase])

  const broadcast = (updatedTasks: Task[]): void => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'tasks_update',
      payload: { tasks: updatedTasks, userId: user.id }
    })
  }

  const addTask = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!newTask.trim()) return

    const task: Task = {
      id: crypto.randomUUID(),
      content: newTask.trim(),
      columnId: 'todo'
    }

    const updated = [...tasks, task]
    setTasks(updated)
    setNewTask('')
    broadcast(updated)
  }

  const deleteTask = (taskId: string): void => {
    const updated = tasks.filter((t) => t.id !== taskId)
    setTasks(updated)
    broadcast(updated)
  }

  const onDragEnd = (result: DropResult): void => {
    if (!result.destination) return

    const { destination, draggableId } = result

    // Create a new array to avoid mutating state directly
    const newTasks = Array.from(tasks)
    const taskIndex = newTasks.findIndex((t) => t.id === draggableId)
    if (taskIndex === -1) return

    const task = newTasks[taskIndex]

    // Update the task's column
    const updatedTask = {
      ...task,
      columnId: destination.droppableId as Task['columnId']
    }

    // Optimistic UI update
    // Note: For a real reorder capability within columns, we'd need an 'order' field.
    // For this simple version, we just update the column.

    newTasks[taskIndex] = updatedTask

    setTasks(newTasks)
    broadcast(newTasks)
  }

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-zinc-500/20 text-zinc-300' },
    {
      id: 'inprogress',
      title: 'In Progress',
      color: 'bg-blue-500/20 text-blue-300'
    },
    { id: 'done', title: 'Done', color: 'bg-emerald-500/20 text-emerald-300' }
  ]

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950/50 backdrop-blur-sm p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">Task Board</h2>
        <form onSubmit={addTask} className="flex gap-2">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="bg-white/5 border-white/10 text-white w-64"
          />
          <Button type="submit" size="icon" className="bg-white/10 hover:bg-white/20">
            <Plus className="w-4 h-4" />
          </Button>
        </form>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-3 gap-6 h-full min-h-0">
          {columns.map((col) => (
            <Droppable key={col.id} droppableId={col.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col bg-black/20 rounded-xl border border-white/5 overflow-hidden"
                >
                  <div className={cn('p-3 font-medium text-sm flex items-center gap-2', col.color)}>
                    <div className="w-2 h-2 rounded-full bg-current" />
                    {col.title}
                    <span className="ml-auto opacity-50 text-xs">
                      {tasks.filter((t) => t.columnId === col.id).length}
                    </span>
                  </div>
                  <div className="flex-1 p-3 overflow-y-auto space-y-3">
                    {tasks
                      .filter((t) => t.columnId === col.id)
                      .map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-zinc-900/80 border border-white/5 p-3 rounded-lg group hover:border-white/20 transition-all shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-sm text-zinc-200 leading-relaxed">
                                  {task.content}
                                </span>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}
