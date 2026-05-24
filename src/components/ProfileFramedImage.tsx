import {
  clampProfileMediaFrame,
  framedImageStyle,
  type ProfileMediaFrame,
} from '../profile/profileMediaFrame'

type ProfileFramedImageProps = {
  src: string
  frame: ProfileMediaFrame
  alt?: string
  shape?: 'rect' | 'circle'
  style?: React.CSSProperties
}

export default function ProfileFramedImage({
  src,
  frame,
  alt = '',
  shape = 'rect',
  style,
}: ProfileFramedImageProps) {
  const clamped = clampProfileMediaFrame(frame)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: shape === 'circle' ? '50%' : undefined,
        ...style,
      }}
    >
      <img src={src} alt={alt} draggable={false} style={framedImageStyle(clamped)} />
    </div>
  )
}
