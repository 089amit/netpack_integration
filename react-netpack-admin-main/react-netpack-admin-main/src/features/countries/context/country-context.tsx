import { createContext, useContext, useReducer } from 'react'
import { Country } from '@/type/country'
import http from '@/utils/http'
import { COUNTRY_ENDPOINT } from '@/constants/endpoint'

// ----------------------------
// Types
// ----------------------------
type State = {
  open: '' | 'create' | 'update' | 'rate'
  currentRow: Country | null
}

type Action =
  | { type: 'SET_OPEN'; payload: State['open'] }
  | { type: 'SET_CURRENT_ROW'; payload: Country | null }

const initialState: State = {
  open: '',
  currentRow: null,
}

// ----------------------------
// Reducer
// ----------------------------
function countryReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_OPEN':
      return { ...state, open: action.payload }
    case 'SET_CURRENT_ROW':
      return { ...state, currentRow: action.payload }
    default:
      return state
  }
}

// ----------------------------
// Context
// ----------------------------
const CountryContext = createContext<{
  state: State
  setOpen: (open: State['open']) => void
  setCurrentRow: (row: Country | null) => void
  createCountry: (data: Omit<Country, 'id'>) => Promise<Country | null>
  updateCountry: (
    id: number,
    data: Partial<Omit<Country, 'id'>>
  ) => Promise<Country | null>
}>({
  state: initialState,
  setOpen: () => {},
  setCurrentRow: () => {},
  createCountry: async () => null,
  updateCountry: async () => null,
})

// ----------------------------
// Provider
// ----------------------------
export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(countryReducer, initialState)

  const setOpen = (open: State['open']) => {
    dispatch({ type: 'SET_OPEN', payload: open })
  }

  const setCurrentRow = (row: Country | null) => {
    dispatch({ type: 'SET_CURRENT_ROW', payload: row })
  }

  const createCountry = async (data: Omit<Country, 'id'>) => {
    try {
      const response = await http.post<Country | { data: Country }>(
        COUNTRY_ENDPOINT.CREATE_COUNTRY,
        data
      )

      // Handle different response structures
      const countryData = 'data' in response ? response.data : response
      console.log('Country created successfully:', countryData)
      return countryData
    } catch (err) {
      console.error('Failed to create country:', err)
      return null
    }
  }

  const updateCountry = async (
    id: number,
    data: Partial<Omit<Country, 'id'>>
  ) => {
    try {
      const response = await http.put<Country | { data: Country }>(
        COUNTRY_ENDPOINT.UPDATE_COUNTRY(id),
        data
      )

      // Handle different response structures
      const countryData = 'data' in response ? response.data : response
      console.log('Country updated successfully:', countryData)
      return countryData
    } catch (err) {
      console.error('Failed to update country:', err)
      return null
    }
  }

  return (
    <CountryContext.Provider
      value={{
        state,
        setOpen,
        setCurrentRow,
        createCountry,
        updateCountry,
      }}
    >
      {children}
    </CountryContext.Provider>
  )
}

// ----------------------------
// Hook
// ----------------------------
export function useCountry() {
  return useContext(CountryContext)
}
