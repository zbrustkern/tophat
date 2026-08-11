import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Plan } from '@/types/chart'

// Mock User
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User'
}

// Create Mock Contexts directly in test-utils to avoid Firebase imports
const MockAuthContext = React.createContext<any>({ user: mockUser, loading: false })
const MockPlansContext = React.createContext<any>({ 
  plans: [], 
  loading: false, 
  error: null,
  deletePlan: async () => {},
  refreshPlans: async () => {} 
})

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  plans?: Plan[];
  user?: any;
  loading?: boolean;
}

const AllTheProviders = ({ children, options }: { children: React.ReactNode, options?: CustomRenderOptions }) => {
  return (
    <MockAuthContext.Provider value={{ user: options?.user !== undefined ? options.user : mockUser, loading: false }}>
      <MockPlansContext.Provider value={{ 
        plans: options?.plans || [], 
        loading: options?.loading || false, 
        error: null,
        deletePlan: async () => {},
        refreshPlans: async () => {} 
      }}>
        {children}
      </MockPlansContext.Provider>
    </MockAuthContext.Provider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  // Return the render method with the wrapper
  return render(ui, {
    wrapper: ({ children }) => <AllTheProviders options={options}>{children}</AllTheProviders>,
    ...options,
  })
}

// re-export everything
export * from '@testing-library/react'
// override render method
export { customRender as render, MockAuthContext, MockPlansContext }
