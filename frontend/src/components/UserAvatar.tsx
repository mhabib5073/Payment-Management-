import { Avatar } from 'antd'

const COLORS = ['#1f6feb', '#8250df', '#bf3989', '#cf222e', '#bc4c00', '#1a7f37', '#0969da', '#6639ba']

function colorFor(text: string): string {
  let hash = 0
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return COLORS[hash % COLORS.length]
}

export function UserAvatar({ first, last, size = 'default' }: { first: string; last: string; size?: number | 'small' | 'default' | 'large' }) {
  return (
    <Avatar
      size={size}
      style={{
        backgroundColor: colorFor(first + last),
        flexShrink: 0,
        fontSize: typeof size === 'number' ? size * 0.38 : undefined,
      }}
    >
      {`${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()}
    </Avatar>
  )
}