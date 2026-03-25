interface Props {
  stars: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({ stars, max = 3, size = 'md' }: Props) {
  const sizes = { sm: 'text-sm', md: 'text-xl', lg: 'text-2xl' }
  return (
    <span className={`inline-flex gap-0.5 ${sizes[size]}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < stars ? 'text-yellow-400' : 'text-[#2d3748]'}>
          ★
        </span>
      ))}
    </span>
  )
}
