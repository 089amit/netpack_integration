import React, { useState } from 'react'
import { toast } from 'sonner'
import http from '@/utils/http'
import { FORWARDING_COMPANY_ENDPOINTS } from '@/constants/endpoint'
import { ForwardingCompany } from '../data/schema'

type TasksDialogType =
  | 'create'
  | 'update'
  | 'delete'
  | 'import'
  | 'services'
  | null

interface TasksContextType {
  open: TasksDialogType
  setOpen: (value: TasksDialogType) => void
  mode: TasksDialogType
  setMode: (mode: TasksDialogType) => void
  currentRow: ForwardingCompany | null
  setCurrentRow: React.Dispatch<React.SetStateAction<ForwardingCompany | null>>
  refreshForwardingCompanies: () => void
  deleteForwardingCompany: (id: number) => Promise<boolean>
}

const TasksContext = React.createContext<TasksContextType | null>(null)

interface Props {
  children: React.ReactNode
}

export default function TasksProvider({
  children,
  refreshForwardingCompanies,
}: Props & {
  refreshForwardingCompanies?: () => void
}) {
  const [open, setOpen] = useState<TasksDialogType>(null)
  const [mode, setMode] = useState<TasksDialogType>(null)
  const [currentRow, setCurrentRow] = useState<ForwardingCompany | null>(null)

  const deleteForwardingCompany = async (id: number): Promise<boolean> => {
    try {
      await http.delete(FORWARDING_COMPANY_ENDPOINTS.DELETE_COMPANY(id))
      toast.success('Forwarding company deleted successfully')
      if (refreshForwardingCompanies) {
        refreshForwardingCompanies()
      }
      return true
    } catch (error) {
      console.error('Failed to delete forwarding company:', error)
      toast.error('Failed to delete forwarding company')
      return false
    }
  }

  return (
    <TasksContext.Provider
      value={{
        open,
        setOpen,
        mode,
        setMode,
        currentRow,
        setCurrentRow,
        refreshForwardingCompanies: refreshForwardingCompanies || (() => {}),
        deleteForwardingCompany,
      }}
    >
      {children}
    </TasksContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTasks = () => {
  const tasksContext = React.useContext(TasksContext)

  if (!tasksContext) {
    throw new Error('useTasks has to be used within <TasksProvider>')
  }

  return tasksContext
}
