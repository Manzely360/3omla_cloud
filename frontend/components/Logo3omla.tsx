import Image from 'next/image'
import { useEffect, useState } from 'react'

interface Logo3omlaProps {
  variant?: 'full' | 'icon' | 'wordmark'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  theme?: 'auto' | 'dark' | 'light'
}

const logomarkSizes: Record<NonNullable<Logo3omlaProps['size']>, number> = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96
}

const wordmarkSizes: Record<NonNullable<Logo3omlaProps['size']>, { width: number; height: number }> = {
  sm: { width: 140, height: 48 },
  md: { width: 180, height: 60 },
  lg: { width: 220, height: 76 },
  xl: { width: 280, height: 96 }
}

const wordClasses: Record<NonNullable<Logo3omlaProps['size']>, string> = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl',
  xl: 'text-6xl'
}

const Logo3omla = ({
  variant = 'full',
  size = 'md',
  className = '',
  theme = 'auto'
}: Logo3omlaProps) => {
  const [isLightMode, setIsLightMode] = useState(() => theme === 'light')

  useEffect(() => {
    if (theme === 'light') {
      setIsLightMode(true)
      return
    }

    if (theme === 'dark') {
      setIsLightMode(false)
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    const html = document.documentElement
    const detectTheme = () => setIsLightMode(html.classList.contains('theme-light'))

    detectTheme()

    const observer = new MutationObserver(detectTheme)
    observer.observe(html, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [theme])

  if (variant === 'icon') {
    const dimension = logomarkSizes[size]
    return (
      <Image
        src="/3omla-logomark.png"
        width={dimension}
        height={dimension}
        alt="3OMLA logomark"
        className={className}
        priority={size === 'xl'}
      />
    )
  }

  if (variant === 'wordmark') {
    const { width, height } = wordmarkSizes[size]
    const source = isLightMode ? '/3omla-logo-light.png' : '/3omla-logo-dark.png'

    return (
      <Image
        src={source}
        width={width}
        height={height}
        alt="3OMLA wordmark"
        className={className}
        priority={size === 'xl'}
      />
    )
  }

  const dimension = logomarkSizes[size]
  const wordColorClass = isLightMode ? 'logo-3omla-word--light' : 'logo-3omla-word--dark'

  return (
    <div className={`flex items-center gap-0 ${className}`} dir="ltr">
      <Image
        src="/3omla-logomark.png"
        width={dimension}
        height={dimension}
        alt="3OMLA logomark"
        priority={size === 'xl'}
      />
      <span
        className={`${wordClasses[size]} font-black leading-none logo-3omla-word ${wordColorClass}`}
        style={{ marginLeft: '-0.2rem' }}
      >
        omla
      </span>
    </div>
  )
}

export default Logo3omla
