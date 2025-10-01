import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price)
}

export function formatPercentage(value: number, decimals = 2) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`
}

export function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatVolume(volume: number) {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B`
  }
  if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`
  }
  if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`
  }
  return volume.toFixed(2)
}

export function formatMarketCap(marketCap: number) {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`
  }
  if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`
  }
  if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`
  }
  return `$${marketCap.toFixed(2)}`
}

export function getChangeColor(change: number) {
  if (change > 0) return "text-green-500"
  if (change < 0) return "text-red-500"
  return "text-gray-500"
}

export function getChangeBgColor(change: number) {
  if (change > 0) return "bg-green-500/10"
  if (change < 0) return "bg-red-500/10"
  return "bg-gray-500/10"
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
