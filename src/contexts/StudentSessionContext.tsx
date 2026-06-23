/**
 * Student session context — stores the student JWT in memory.
 * CONTRACT.md §4: JWT stored in memory only — never localStorage, never sessionStorage.
 * SPEC1: 8-hour expiry; client checks expires_at and shows "Session expiring" if < 30 min.
 */
'use client'

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'

export interface StudentSession {
  token: string
  studentId: string
  classIds: string[]
  expiresAt: number  // Unix timestamp (seconds)
}

interface StudentSessionContextType {
  session: StudentSession | null
  setSession: (session: StudentSession | null) => void
  clearSession: () => void
  isExpiringSoon: boolean  // true if < 30 min remaining
}

const StudentSessionContext = createContext<StudentSessionContextType | null>(null)

export function StudentSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<StudentSession | null>(null)

  const setSession = (s: StudentSession | null) => setSessionState(s)
  const clearSession = () => setSessionState(null)

  const isExpiringSoon = useMemo(() => {
    if (!session) return false
    const remaining = session.expiresAt - Math.floor(Date.now() / 1000)
    return remaining > 0 && remaining < 30 * 60  // < 30 minutes
  }, [session])

  return (
    <StudentSessionContext.Provider value={{ session, setSession, clearSession, isExpiringSoon }}>
      {children}
    </StudentSessionContext.Provider>
  )
}

export function useStudentSession(): StudentSessionContextType {
  const ctx = useContext(StudentSessionContext)
  if (!ctx) throw new Error('useStudentSession must be used within StudentSessionProvider')
  return ctx
}
