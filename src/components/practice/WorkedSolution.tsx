'use client'

/**
 * Step-by-step worked solution.
 * Steps split on double newlines. Each step revealed individually;
 * focus moves to the newly revealed step for keyboard/screen-reader users.
 */
import { useState, useRef, useEffect } from 'react'
import { MathText } from '@/components/ui/MathText'

interface WorkedSolutionProps {
  solutionHtml: string
  onNext?:      () => void
}

export function splitSteps(solutionHtml: string): string[] {
  return solutionHtml.split('\n\n').filter(s => s.trim())
}

export function WorkedSolution({ solutionHtml, onNext }: WorkedSolutionProps) {
  const steps = splitSteps(solutionHtml)
  const [visibleCount, setVisibleCount] = useState(1)

  const stepRefs    = useRef<(HTMLDivElement | null)[]>([])
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    stepRefs.current[visibleCount - 1]?.focus()
  }, [visibleCount])

  const allVisible = visibleCount >= steps.length

  return (
    <div
      role="note"
      aria-label="Worked solution"
      className="bg-success-light border border-success border-l-4 rounded-md px-5 py-4 mt-4"
    >
      <h3 className="text-sm font-bold text-success mb-4 uppercase tracking-widest">
        Worked solution
      </h3>

      <div className="text-ink">
        {steps.slice(0, visibleCount).map((step, i) => (
          <div
            key={i}
            ref={el => { stepRefs.current[i] = el }}
            tabIndex={-1}
            className={`outline-none ${i < visibleCount - 1 ? 'mb-4 pb-4 border-b border-edge' : ''}`}
          >
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Step {i + 1}
            </p>
            <div className="leading-relaxed">
              <MathText html={step} block />
            </div>
          </div>
        ))}
      </div>

      {!allVisible && (
        <button
          onClick={() => setVisibleCount(c => c + 1)}
          aria-label={`Show step ${visibleCount + 1} of ${steps.length}`}
          className="mt-4 bg-transparent text-success border border-success rounded-lg px-5 py-2.5 text-base font-semibold cursor-pointer min-h-touch hover:bg-success/10 active:scale-[0.98] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-1 outline-none"
        >
          Next step →
        </button>
      )}

      {allVisible && onNext && (
        <button
          onClick={onNext}
          className="mt-5 bg-primary text-white border-0 rounded-lg px-6 py-3 text-base font-semibold cursor-pointer min-h-touch hover:bg-primary-dark active:scale-[0.98] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 outline-none"
        >
          Next question →
        </button>
      )}
    </div>
  )
}
