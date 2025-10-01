/**
 * Accessibility utilities and configurations
 * Ensures WCAG 2.1 AA compliance
 */

// Color contrast ratios for different text sizes
export const CONTRAST_RATIOS = {
  NORMAL_TEXT: 4.5, // WCAG AA
  LARGE_TEXT: 3.0,  // WCAG AA
  ENHANCED: 7.0,    // WCAG AAA
} as const;

// Focus management
export const focusElement = (element: HTMLElement | null) => {
  if (element) {
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

// Skip to content link
export const createSkipLink = () => {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md';
  document.body.insertBefore(skipLink, document.body.firstChild);
};

// ARIA live region for announcements
export const createLiveRegion = () => {
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  liveRegion.id = 'live-region';
  document.body.appendChild(liveRegion);
  return liveRegion;
};

// Announce to screen readers
export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const liveRegion = document.getElementById('live-region') || createLiveRegion();
  liveRegion.setAttribute('aria-live', priority);
  liveRegion.textContent = message;
  
  // Clear after announcement
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 1000);
};

// Keyboard navigation helpers
export const KEYBOARD_NAVIGATION = {
  TAB: 'Tab',
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;

// Focus trap for modals
export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === KEYBOARD_NAVIGATION.TAB) {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);
  
  // Focus first element
  firstElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
};

// High contrast mode detection
export const isHighContrastMode = () => {
  if (typeof window === 'undefined') return false;
  
  // Check for Windows High Contrast Mode
  if (window.matchMedia('(-ms-high-contrast: active)').matches) {
    return true;
  }
  
  // Check for forced colors
  if (window.matchMedia('(forced-colors: active)').matches) {
    return true;
  }
  
  return false;
};

// Reduced motion detection
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Screen reader detection
export const isScreenReader = () => {
  if (typeof window === 'undefined') return false;
  
  // Check for common screen reader indicators
  const hasScreenReader = 
    window.navigator.userAgent.includes('NVDA') ||
    window.navigator.userAgent.includes('JAWS') ||
    window.navigator.userAgent.includes('VoiceOver') ||
    window.navigator.userAgent.includes('TalkBack');
  
  return hasScreenReader;
};

// Color blindness simulation
export const simulateColorBlindness = (type: 'protanopia' | 'deuteranopia' | 'tritanopia') => {
  const style = document.createElement('style');
  style.id = 'colorblind-simulation';
  
  const filters = {
    protanopia: 'filter: hue-rotate(90deg) saturate(1.5);',
    deuteranopia: 'filter: hue-rotate(180deg) saturate(1.5);',
    tritanopia: 'filter: hue-rotate(270deg) saturate(1.5);',
  };
  
  style.textContent = `* { ${filters[type]} }`;
  document.head.appendChild(style);
};

// Remove color blindness simulation
export const removeColorBlindnessSimulation = () => {
  const style = document.getElementById('colorblind-simulation');
  if (style) {
    style.remove();
  }
};

// Accessibility testing helpers
export const accessibilityTest = {
  // Check if element has proper ARIA labels
  hasAriaLabel: (element: HTMLElement) => {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.getAttribute('title')
    );
  },
  
  // Check if element is focusable
  isFocusable: (element: HTMLElement) => {
    const tabIndex = element.getAttribute('tabindex');
    return (
      element.tagName === 'BUTTON' ||
      element.tagName === 'A' ||
      element.tagName === 'INPUT' ||
      element.tagName === 'SELECT' ||
      element.tagName === 'TEXTAREA' ||
      (tabIndex && parseInt(tabIndex) >= 0)
    );
  },
  
  // Check if element has proper heading hierarchy
  hasProperHeadingHierarchy: (element: HTMLElement) => {
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    
    for (const heading of headings) {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        return false;
      }
      lastLevel = level;
    }
    
    return true;
  },
  
  // Check if form has proper labels
  hasProperFormLabels: (form: HTMLFormElement) => {
    const inputs = form.querySelectorAll('input, select, textarea');
    
    for (const input of inputs) {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      
      if (!id && !ariaLabel && !ariaLabelledby) {
        return false;
      }
    }
    
    return true;
  },
};

// Accessibility announcements for common actions
export const announcements = {
  tradeExecuted: (symbol: string, side: string, amount: string) => {
    announce(`Trade executed: ${side} ${amount} ${symbol}`);
  },
  
  orderCancelled: (orderId: string) => {
    announce(`Order ${orderId} cancelled`);
  },
  
  dataRefreshed: () => {
    announce('Market data refreshed');
  },
  
  errorOccurred: (message: string) => {
    announce(`Error: ${message}`, 'assertive');
  },
  
  success: (message: string) => {
    announce(`Success: ${message}`);
  },
  
  navigation: (page: string) => {
    announce(`Navigated to ${page}`);
  },
};

// Accessibility configuration for the app
export const accessibilityConfig = {
  // Enable skip links
  enableSkipLinks: true,
  
  // Enable live regions
  enableLiveRegions: true,
  
  // Enable focus management
  enableFocusManagement: true,
  
  // Enable keyboard navigation
  enableKeyboardNavigation: true,
  
  // Enable high contrast mode
  enableHighContrastMode: true,
  
  // Enable reduced motion
  enableReducedMotion: true,
  
  // Enable screen reader optimizations
  enableScreenReaderOptimizations: true,
  
  // Announce page changes
  announcePageChanges: true,
  
  // Announce data updates
  announceDataUpdates: true,
  
  // Announce errors
  announceErrors: true,
  
  // Announce successes
  announceSuccesses: true,
};

// Initialize accessibility features
export const initializeAccessibility = () => {
  if (typeof window === 'undefined') return;
  
  // Create skip link
  if (accessibilityConfig.enableSkipLinks) {
    createSkipLink();
  }
  
  // Create live region
  if (accessibilityConfig.enableLiveRegions) {
    createLiveRegion();
  }
  
  // Set up reduced motion
  if (accessibilityConfig.enableReducedMotion && prefersReducedMotion()) {
    document.documentElement.style.setProperty('--animation-duration', '0.01ms');
    document.documentElement.style.setProperty('--animation-iteration-count', '1');
  }
  
  // Set up high contrast mode
  if (accessibilityConfig.enableHighContrastMode && isHighContrastMode()) {
    document.documentElement.classList.add('high-contrast');
  }
  
  // Set up screen reader optimizations
  if (accessibilityConfig.enableScreenReaderOptimizations && isScreenReader()) {
    document.documentElement.classList.add('screen-reader');
  }
};

export default {
  focusElement,
  createSkipLink,
  createLiveRegion,
  announce,
  trapFocus,
  isHighContrastMode,
  prefersReducedMotion,
  isScreenReader,
  simulateColorBlindness,
  removeColorBlindnessSimulation,
  accessibilityTest,
  announcements,
  accessibilityConfig,
  initializeAccessibility,
};

