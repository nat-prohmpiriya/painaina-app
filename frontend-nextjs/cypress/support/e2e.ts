import './commands'
import '@testing-library/cypress/add-commands'
import 'cypress-real-events'

// Prevent TypeScript errors when using cy.findByTestId etc
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to intercept and mock packing list API
       */
      mockPackingListAPI(tripId: string, items?: PackingItemMock[]): Chainable<void>

      /**
       * Custom command to intercept and mock packing templates API
       */
      mockPackingTemplatesAPI(): Chainable<void>

      /**
       * Custom command to login (mock Clerk auth)
       */
      mockAuth(): Chainable<void>
    }
  }
}

export interface PackingItemMock {
  id: string
  name: string
  category: string
  quantity: number
  packed: boolean
  order: number
  notes?: string
}
