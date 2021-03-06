import { createContext, ProviderProps, useContext } from 'react'

export const InitialDataContext = createContext({} as any)
export const useInitialDataContext = () => useContext(InitialDataContext)

export const InitialDataProvider = (props: ProviderProps<any>) => {
  const { value, children } = props
  return <InitialDataContext.Provider value={value ?? {}} children={children} />
}

export function useInitialData() {
  return useInitialDataContext()
}
