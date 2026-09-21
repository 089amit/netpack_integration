import { createContext, useContext, useReducer } from 'react'
import { Zone } from '@/type/zone'
import http from '@/utils/http'
import { ZONE_ENDPOINT } from '@/constants/endpoint'

// ----------------------------
// Types
// ----------------------------
type State = {
  open: '' | 'create' | 'update'
  currentRow: Zone | null
}

type Action =
  | { type: 'SET_OPEN'; payload: State['open'] }
  | { type: 'SET_CURRENT_ROW'; payload: Zone | null }

const initialState: State = {
  open: '',
  currentRow: null,
}

// ----------------------------
// Reducer
// ----------------------------
function zoneReducer(state: State, action: Action): State {
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
const ZoneContext = createContext<{
  state: State
  setOpen: (open: State['open']) => void
  setCurrentRow: (row: Zone | null) => void
  createZone: (
    data: Omit<Zone, 'id'> & { countryIds?: number[] }
  ) => Promise<Zone | null>
  updateZone: (
    id: number,
    data: Partial<Omit<Zone, 'id'>> & { countryIds?: number[] }
  ) => Promise<Zone | null>
  deleteZone: (id: number) => Promise<boolean>
}>({
  state: initialState,
  setOpen: () => {},
  setCurrentRow: () => {},
  createZone: async () => null,
  updateZone: async () => null,
  deleteZone: async () => false,
})

// ----------------------------
// Provider
// ----------------------------
export function ZoneProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(zoneReducer, initialState)

  const setOpen = (open: State['open']) => {
    dispatch({ type: 'SET_OPEN', payload: open })
  }

  const setCurrentRow = (row: Zone | null) => {
    dispatch({ type: 'SET_CURRENT_ROW', payload: row })
  }

  const createZone = async (
    data: Omit<Zone, 'id'> & { countryIds?: number[] }
  ) => {
    try {
      const response = await http.post<{ data: Zone } | Zone>(
        ZONE_ENDPOINT.CREATE_ZONE,
        data
      )

      // Handle different response structures
      console.log('Create zone response:', response)

      // If response has a data property, return response.data
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data
      }

      // If response is the zone object directly, return it
      if (response && typeof response === 'object' && 'id' in response) {
        return response as Zone
      }

      console.error('Unexpected response structure:', response)
      return null
    } catch (err) {
      console.error('Failed to create zone:', err)
      return null
    }
  }

  const updateZone = async (
    id: number,
    data: Partial<Omit<Zone, 'id'>> & { countryIds?: number[] }
  ) => {
    try {
      const response = await http.put<{ data: Zone } | Zone>(
        ZONE_ENDPOINT.UPDATE_ZONE(id),
        data
      )

      // Handle different response structures
      console.log('Update zone response:', response)

      // If response has a data property, return response.data
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data
      }

      // If response is the zone object directly, return it
      if (response && typeof response === 'object' && 'id' in response) {
        return response as Zone
      }

      console.error('Unexpected response structure:', response)
      return null
    } catch (err) {
      console.error('Failed to update zone:', err)
      return null
    }
  }

  const deleteZone = async (id: number) => {
    try {
      await http.delete(ZONE_ENDPOINT.DELETE_ZONE(id))
      return true
    } catch (err) {
      console.error('Failed to delete zone:', err)
      return false
    }
  }

  return (
    <ZoneContext.Provider
      value={{
        state,
        setOpen,
        setCurrentRow,
        createZone,
        updateZone,
        deleteZone,
      }}
    >
      {children}
    </ZoneContext.Provider>
  )
}

// ----------------------------
// Hook
// ----------------------------
export function useZone() {
  return useContext(ZoneContext)
}
