import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, useTheme, ThemeToggle } from '../src/components/ui/ThemeProvider';
import React from 'react';

// Test component to access theme context
const TestComponent = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button onClick={toggleTheme} data-testid="toggle-button">Toggle</button>
      <button onClick={() => setTheme('light')} data-testid="set-light">Set Light</button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">Set Dark</button>
    </div>
  );
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Clear localStorage mock before each test
    const localStorageMock = global.localStorage as jest.Mocked<typeof localStorage>;
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    
    // Reset document classes
    document.documentElement.className = '';
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  // Positive Test 1: ThemeProvider provides context without errors
  describe('Context Provision', () => {
    it('should provide theme context to children components', () => {
      // This test verifies the objective: ThemeProvider provides context without errors
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-button')).toBeInTheDocument();
    });

    it('should render children after mounting', () => {
      render(
        <ThemeProvider>
          <div data-testid="child-content">Test Content</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  // Positive Test 2: Theme toggle functionality works correctly
  describe('Theme Toggle Functionality', () => {
    it('should toggle theme from light to dark when toggle is called', async () => {
      // This test verifies the objective: Theme toggle button works and themes switch correctly
      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      // Wait for component to mount
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const themeDisplay = screen.getByTestId('current-theme');
      const toggleButton = screen.getByTestId('toggle-button');

      // Initial theme should be light
      expect(themeDisplay).toHaveTextContent('light');

      // Toggle to dark
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      expect(themeDisplay).toHaveTextContent('dark');

      // Toggle back to light
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      expect(themeDisplay).toHaveTextContent('light');
    });

    it('should set theme explicitly using setTheme', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const themeDisplay = screen.getByTestId('current-theme');
      const setDarkButton = screen.getByTestId('set-dark');

      expect(themeDisplay).toHaveTextContent('light');

      await act(async () => {
        fireEvent.click(setDarkButton);
      });

      expect(themeDisplay).toHaveTextContent('dark');
    });
  });

  // Positive Test 3: Theme persistence in localStorage
  describe('Theme Persistence', () => {
    it('should save theme preference to localStorage', async () => {
      const localStorageMock = global.localStorage as jest.Mocked<typeof localStorage>;
      
      render(
        <ThemeProvider defaultTheme="light" storageKey="test-theme">
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const toggleButton = screen.getByTestId('toggle-button');

      await act(async () => {
        fireEvent.click(toggleButton);
      });

      // Verify localStorage was called with correct theme
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-theme', 'dark');
    });

    it('should load theme preference from localStorage on mount', async () => {
      const localStorageMock = global.localStorage as jest.Mocked<typeof localStorage>;
      localStorageMock.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider defaultTheme="light" storageKey="test-theme">
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-theme');
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });
  });

  // Positive Test 4: System preference detection
  describe('System Preference Detection', () => {
    it('should use system preference when no stored theme exists', async () => {
      // Mock system prefers dark mode
      const mockMatchMedia = window.matchMedia as jest.Mock;
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const localStorageMock = global.localStorage as jest.Mocked<typeof localStorage>;
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ThemeProvider storageKey="test-theme">
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });
  });

  // Positive Test 5: Document class updates
  describe('Document Class Updates', () => {
    it('should update document classes when theme changes', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const toggleButton = screen.getByTestId('toggle-button');

      // Initial state should have light class
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      // Toggle to dark
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });
  });

  // ThemeToggle component tests
  describe('ThemeToggle Component', () => {
    it('should render theme toggle button with correct icon', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('🌙');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    });

    it('should show sun icon when theme is dark', async () => {
      const localStorageMock = global.localStorage as jest.Mocked<typeof localStorage>;
      localStorageMock.getItem.mockReturnValue('dark'); // Stored dark theme
      
      render(
        <ThemeProvider defaultTheme="light" storageKey="test-theme">
          <ThemeToggle />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('☀️');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    });

    it('should toggle theme when clicked', async () => {
      const localStorageMock = global.localStorage as jest.Mocked<typeof localStorage>;
      localStorageMock.getItem.mockReturnValue(null); // No stored theme
      
      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const button = screen.getByRole('button');
      
      // Should show moon initially (light theme)
      expect(button).toHaveTextContent('🌙');

      await act(async () => {
        fireEvent.click(button);
      });

      // Should show sun after toggle (dark theme)
      expect(button).toHaveTextContent('☀️');
    });
  });
});

// Negative Tests
describe('ThemeProvider Error Handling', () => {
  // Negative Test 1: useTheme outside provider
  it('should throw error when useTheme is used outside ThemeProvider', () => {
    // This test verifies error handling: useTheme throws error when used outside ThemeProvider
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleError.mockRestore();
  });

  // Negative Test 2: localStorage unavailable
  it('should handle localStorage unavailability gracefully', async () => {
    // This test verifies error handling: Graceful fallback when localStorage is not available
    const localStorageMock = global.localStorage as jest.Mocked<typeof localStorage>;
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage not available');
    });
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage not available');
    });

    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should fallback to default theme when localStorage fails during initialization
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    
    const toggleButton = screen.getByTestId('toggle-button');

    // Should not throw error when localStorage fails during theme change
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    // Theme should still change despite localStorage error
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
  });

  // Negative Test 3: Invalid stored theme
  it('should fallback to default theme when invalid theme is stored', async () => {
    const localStorageMock = global.localStorage as jest.Mocked<typeof localStorage>;
    localStorageMock.getItem.mockReturnValue('invalid-theme');

    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <TestComponent />
      </ThemeProvider>
      );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should fallback to default theme (light)
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
  });

  it('should handle localStorage getItem errors gracefully', async () => {
    const localStorageMock = global.localStorage as jest.Mocked<typeof localStorage>;
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage not available');
    });

    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should fallback to default theme
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });
});