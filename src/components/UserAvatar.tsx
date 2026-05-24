import { deriveInitial } from '../profile/profileUtils'
import ProfileFramedImage from './ProfileFramedImage'
import { DEFAULT_AVATAR_FRAME } from '../profile/profileMediaFrame'
import type { ProfileMediaFrame } from '../profile/types'

type UserAvatarProps = {
  displayName: string
  avatarColor: string
  avatarImageUrl?: string | null
  avatarFrame?: ProfileMediaFrame | null
  size?: number
  fontSize?: number
}

export default function UserAvatar({
  displayName,
  avatarColor,
  avatarImageUrl,
  avatarFrame,
  size = 44,
  fontSize,
}: UserAvatarProps) {
  const initial = deriveInitial(displayName)
  const glyphSize = fontSize ?? Math.round(size * 0.4)

  if (avatarImageUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <ProfileFramedImage
          src={avatarImageUrl}
          frame={avatarFrame ?? DEFAULT_AVATAR_FRAME}
          shape="circle"
        />
      </div>
    )
  }

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: avatarColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: glyphSize,
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
    >
      {initial}
    </span>
  )
}
