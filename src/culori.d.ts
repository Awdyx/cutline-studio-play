declare module 'culori' {
  export function formatHex(color: unknown): string | undefined
  export function formatRgb(color: unknown): string
  export function parse(color: string): unknown
}
