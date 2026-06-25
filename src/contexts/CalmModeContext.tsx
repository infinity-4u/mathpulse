'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface CalmCtx { isCalm: boolean; toggleCalm: () => void }

const CalmContext = createContext<CalmCtx>({ isCalm: false, toggleCalm: () => {} })

export function CalmModeProvider({ children }: { children: ReactNode }) {
  const [isCalm, setIsCalm] = useState(false)

  useEffect(() => {
    if (isCalm) {
      document.documentElement.setAttribute('data-calm', '')
    } else {
      document.documentElement.removeAttribute('data-calm')
    }
  }, [isCalm])

  return (
    <CalmContext.Provider value={{ isCalm, toggleCalm: () => setIsCalm(v => !v) }}>
      {children}
    </CalmContext.Provider>
  )
}

export function useCalm() { return useContext(CalmContext) }
