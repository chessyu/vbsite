interface GradientHeadingProps {
  children: string
  className?: string
}

export default function GradientHeading({ children, className = '' }: GradientHeadingProps) {
  return (
    <h2 className={`font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-4 ${className}`}>
      <span className="gradient-text">{children}</span>
    </h2>
  )
}
