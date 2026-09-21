import React, { createContext, useContext, useState, useEffect } from 'react'
import { Country } from '@/type/country'
import { Customer } from '@/type/customer'
import { toast } from 'sonner'
import http from '@/utils/http'
import { COUNTRY_ENDPOINT, USER_ENDPOINTS } from '@/constants/endpoint'
import useDialogState from '@/hooks/use-dialog-state'

type TasksDialogType =
  | 'create'
  | 'update'
  | 'delete'
  | 'import'
  | 'history'
  | 'email'
  | 'bulk-email'
  | 'bulk-notifcation'

interface TasksContextType {
  // Dialog state (original functionality)
  open: TasksDialogType | null
  setOpen: (str: TasksDialogType | null) => void
  currentRow: Customer | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Customer | null>>

  // Customer state
  customers: Customer[]
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>

  // Country state
  countries: Country[]
  setCountries: React.Dispatch<React.SetStateAction<Country[]>>
  loadingCountries: boolean

  // Selected customers for bulk operations
  selectedCustomers: Customer[]
  setSelectedCustomers: React.Dispatch<React.SetStateAction<Customer[]>>

  // Customer operations
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: number, customer: Customer) => void
  deleteCustomer: (id: number) => void

  // Country operations
  getCountryName: (countryId: number | null) => string
  fetchCountries: () => Promise<void>

  // Refresh function
  refreshCustomers: () => void
}

const TasksContext = createContext<TasksContextType | undefined>(undefined)

export function TasksProvider({
  children,
  refreshCustomers,
}: {
  children: React.ReactNode
  refreshCustomers?: () => void
}) {
  // Dialog state (original functionality)
  const [open, setOpen] = useDialogState<TasksDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Customer | null>(null)

  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([])

  const fetchCountries = async () => {
    try {
      setLoadingCountries(true)
      const response = await http.get<{ data: Country[] }>(
        COUNTRY_ENDPOINT.GET_ALL_COUNTRY
      )
      if (response?.data) {
        setCountries(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error)
    } finally {
      setLoadingCountries(false)
    }
  }

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries()
  }, [])

  const getCountryName = (countryId: number | null): string => {
    if (!countryId) return 'N/A'
    const country = countries.find((c) => c.id === countryId)
    return country ? country.name : `ID: ${countryId}`
  }

  const addCustomer = (customer: Customer) => {
    setCustomers((prev) => [...prev, customer])
  }

  const updateCustomer = (id: number, updatedCustomer: Customer) => {
    setCustomers((prev) =>
      prev.map((customer) => (customer.id === id ? updatedCustomer : customer))
    )
  }

  const deleteCustomer = async (id: number) => {
    try {
      await http.delete(USER_ENDPOINTS.DELETE_CUSTOMER(id))
      setCustomers((prev) => prev.filter((customer) => customer.id !== id))
      toast.success('Customer deleted successfully')
    } catch (error) {
      console.error('Failed to delete customer:', error)
      toast.error('Failed to delete customer')
    }
  }

  const value: TasksContextType = {
    // Dialog state
    open,
    setOpen,
    currentRow,
    setCurrentRow,

    // Customer state
    customers,
    setCustomers,
    countries,
    setCountries,
    loadingCountries,
    selectedCustomers,
    setSelectedCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCountryName,
    fetchCountries,
    refreshCustomers: refreshCustomers || (() => {}),
  }

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}

export function useTasks() {
  const context = useContext(TasksContext)
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider')
  }
  return context
}

export default TasksProvider
