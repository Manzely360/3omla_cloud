"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void
  onClear?: () => void
  suggestions?: Array<{
    symbol: string
    name: string
    price?: number
    change24h?: number
    volume24h?: number
  }>
  onSuggestionSelect?: (suggestion: any) => void
  isLoading?: boolean
}

const SearchComponent = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ 
    className, 
    onSearch, 
    onClear, 
    suggestions = [], 
    onSuggestionSelect,
    isLoading = false,
    ...props 
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState("")
    const [selectedIndex, setSelectedIndex] = React.useState(-1)

    const filteredSuggestions = React.useMemo(() => {
      if (!searchValue.trim()) return suggestions.slice(0, 10)
      return suggestions
        .filter(
          (item) =>
            item.symbol.toLowerCase().includes(searchValue.toLowerCase()) ||
            item.name.toLowerCase().includes(searchValue.toLowerCase())
        )
        .slice(0, 10)
    }, [suggestions, searchValue])

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : prev
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case "Enter":
          e.preventDefault()
          if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
            handleSuggestionSelect(filteredSuggestions[selectedIndex])
          } else {
            onSearch?.(searchValue)
          }
          break
        case "Escape":
          setIsOpen(false)
          setSelectedIndex(-1)
          break
      }
    }

    const handleSuggestionSelect = (suggestion: any) => {
      setSearchValue(suggestion.symbol)
      setIsOpen(false)
      setSelectedIndex(-1)
      onSuggestionSelect?.(suggestion)
    }

    const handleClear = () => {
      setSearchValue("")
      setIsOpen(false)
      setSelectedIndex(-1)
      onClear?.()
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setSearchValue(value)
      setIsOpen(value.length > 0)
      setSelectedIndex(-1)
    }

    const handleInputFocus = () => {
      if (searchValue.length > 0) {
        setIsOpen(true)
      }
    }

    const handleInputBlur = () => {
      // Delay closing to allow clicks on suggestions
      setTimeout(() => setIsOpen(false), 150)
    }

    return (
      <div className="relative w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={ref}
            className={cn(
              "pl-10 pr-10",
              className
            )}
            value={searchValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Search tokens (BTC, Ethereum, etc.)"
            {...props}
          />
          {searchValue && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>

        {isOpen && filteredSuggestions.length > 0 && (
          <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.symbol}-${index}`}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors",
                  selectedIndex === index
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{suggestion.symbol}</span>
                    <span className="text-xs text-muted-foreground">
                      {suggestion.name}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end text-xs">
                  {suggestion.price && (
                    <span className="font-medium">
                      ${suggestion.price.toLocaleString()}
                    </span>
                  )}
                  {suggestion.change24h !== undefined && (
                    <span
                      className={cn(
                        suggestion.change24h >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      )}
                    >
                      {suggestion.change24h >= 0 ? "+" : ""}
                      {suggestion.change24h.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)

SearchComponent.displayName = "Search"

export { SearchComponent as Search }

