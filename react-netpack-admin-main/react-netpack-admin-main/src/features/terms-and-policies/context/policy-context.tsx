'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { TermsAndPolicy } from '@/type/policy'
import http from '@/utils/http'
import { POLICIES_ENDPOINTS } from '@/constants/endpoint'

type PolicyDialogType = 'create' | 'update' | 'preview' | 'delete' | ''

interface PolicyState {
  open: PolicyDialogType
  currentRow: TermsAndPolicy | null
}

interface PolicyContextType {
  state: PolicyState
  setOpen: (type: PolicyDialogType) => void
  setCurrentRow: (row: TermsAndPolicy | null) => void
  createPolicy: (data: Omit<TermsAndPolicy, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
  updatePolicy: (id: number, data: Partial<TermsAndPolicy>) => Promise<boolean>
  deletePolicy: (id: number) => Promise<boolean>
}

const PolicyContext = createContext<PolicyContextType | undefined>(undefined)

export function PolicyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PolicyState>({
    open: '',
    currentRow: null,
  })

  const setOpen = (type: PolicyDialogType) => {
    setState((prev) => ({ ...prev, open: type }))
  }

  const setCurrentRow = (row: TermsAndPolicy | null) => {
    setState((prev) => ({ ...prev, currentRow: row }))
  }

  const createPolicy = async (data: Omit<TermsAndPolicy, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await http.post(POLICIES_ENDPOINTS.CREATE, data)
      return true
    } catch (error) {
      console.error('Failed to create policy:', error)
      return false
    }
  }

  const updatePolicy = async (id: number, data: Partial<TermsAndPolicy>) => {
    try {
      await http.put(POLICIES_ENDPOINTS.UPDATE(id), data)
      return true
    } catch (error) {
      console.error('Failed to update policy:', error)
      return false
    }
  }

  const deletePolicy = async (id: number) => {
    try {
      await http.delete(POLICIES_ENDPOINTS.DELETE(id))
      return true
    } catch (error) {
      console.error('Failed to delete policy:', error)
      return false
    }
  }

  return (
    <PolicyContext.Provider
      value={{
        state,
        setOpen,
        setCurrentRow,
        createPolicy,
        updatePolicy,
        deletePolicy,
      }}
    >
      {children}
    </PolicyContext.Provider>
  )
}

export function usePolicy() {
  const context = useContext(PolicyContext)
  if (!context) {
    throw new Error('usePolicy must be used within a PolicyProvider')
  }
  return context
}
