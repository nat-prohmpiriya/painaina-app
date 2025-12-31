/// <reference types="cypress" />

describe('Packing Section', () => {
  const tripId = 'trip-123'

  beforeEach(() => {
    cy.mockPackingTemplatesAPI()
  })

  describe('Loading State', () => {
    it('should show loading skeleton while fetching data', () => {
      cy.intercept('GET', `**/api/v1/trips/${tripId}/packing`, {
        delay: 1000,
        statusCode: 200,
        body: { id: 'packing-list-1', tripId, items: [] },
      }).as('getPackingListDelayed')

      cy.visit(`/en/trips/${tripId}`)
      cy.get('[data-testid="packing-section-loading"]').should('be.visible')
    })
  })

  describe('Empty State', () => {
    beforeEach(() => {
      cy.fixture('packing').then((data) => {
        cy.intercept('GET', `**/api/v1/trips/${tripId}/packing`, {
          statusCode: 200,
          body: data.emptyPackingList,
        }).as('getEmptyPackingList')
      })
    })

    it('should display empty state when no items exist', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getEmptyPackingList')

      cy.get('[data-testid="packing-section"]').should('be.visible')
      cy.get('[data-testid="packing-empty-state"]').should('be.visible')
      cy.get('[data-testid="packing-empty-state"]').should('contain.text', 'No packing items yet')
    })

    it('should show add item and template buttons in header', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getEmptyPackingList')

      cy.get('[data-testid="packing-section-actions"]').should('be.visible')
      cy.get('[data-testid="add-packing-item-trigger"]').should('be.visible')
      cy.get('[data-testid="packing-template-trigger"]').should('be.visible')
    })
  })

  describe('With Items', () => {
    beforeEach(() => {
      cy.fixture('packing').then((data) => {
        cy.intercept('GET', `**/api/v1/trips/${tripId}/packing`, {
          statusCode: 200,
          body: data.packingListWithItems,
        }).as('getPackingList')
      })
    })

    it('should display packing list with items grouped by category', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-section"]').should('be.visible')
      cy.get('[data-testid="packing-content"]').should('be.visible')

      // Check categories are displayed
      cy.get('[data-testid="packing-category-clothing"]').should('be.visible')
      cy.get('[data-testid="packing-category-toiletries"]').should('be.visible')
      cy.get('[data-testid="packing-category-documents"]').should('be.visible')
      cy.get('[data-testid="packing-category-electronics"]').should('be.visible')
    })

    it('should display progress bar with correct stats', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      // 2 out of 5 items are packed (40%)
      cy.get('[data-testid="packing-progress"]').should('be.visible')
      cy.get('[data-testid="packing-progress-text"]').should('contain.text', '2/5')
      cy.get('[data-testid="packing-progress-percentage"]').should('contain.text', '40%')
    })

    it('should display category headers with stats', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      // Clothing: 1 item, 0 packed
      cy.get('[data-testid="packing-category-header-clothing"]').should('be.visible')
      cy.get('[data-testid="packing-category-stats-clothing"]').should('contain.text', '0/1')

      // Toiletries: 2 items, 1 packed
      cy.get('[data-testid="packing-category-stats-toiletries"]').should('contain.text', '1/2')
    })

    it('should display individual items', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      // Check items are visible
      cy.get('[data-testid="packing-item-item-1"]').should('be.visible')
      cy.get('[data-testid="packing-item-name-item-1"]').should('contain.text', 'T-shirt')
      cy.get('[data-testid="packing-item-quantity-item-1"]').should('contain.text', 'x3')
    })
  })

  describe('Toggle Item', () => {
    beforeEach(() => {
      cy.fixture('packing').then((data) => {
        cy.intercept('GET', `**/api/v1/trips/${tripId}/packing`, {
          statusCode: 200,
          body: data.packingListWithItems,
        }).as('getPackingList')

        cy.intercept('POST', `**/api/v1/trips/${tripId}/packing/items/*/toggle`, {
          statusCode: 200,
          body: { ...data.packingListWithItems.items[0], packed: true },
        }).as('toggleItem')
      })
    })

    it('should toggle item packed status when clicking checkbox', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-item-checkbox-item-1"]').click()
      cy.wait('@toggleItem')
    })
  })
})
