/** Bottom-right corner bracket (┘): arms along bottom + right, opening toward the item. */
export default function ResizeCornerBracket() {
  const arm = 11
  const stroke = 2
  const size = arm + stroke

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
      style={{ display: 'block', overflow: 'visible' }}
    >
      <path
        d={`M 0 ${arm} L ${arm} ${arm} L ${arm} 0`}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
