/**
 * Renders pre-rendered KaTeX HTML safely.
 * KaTeX rendering happens server-side in content.ts — this component
 * only injects the pre-rendered HTML into the DOM.
 * The HTML is generated from static content JSON via katex.renderToString,
 * not from user input, so dangerouslySetInnerHTML is safe here.
 */

interface MathTextProps {
  html: string
  className?: string
  block?: boolean  // if true, renders as a div instead of span
}

export function MathText({ html, className, block }: MathTextProps) {
  if (block) {
    return (
      <div
        className={className}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }
  return (
    <span
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
