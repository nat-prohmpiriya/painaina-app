/// <reference types="cypress" />

describe('Add Packing Item Modal', () => {
  const tripId = 'trip-123'

  beforeEach(() => {
    cy.mockPackingTemplatesAPI()
    cy.fixture('packing').then((data) => {
      cy.intercept('GET', `**/api/v1/trips/${tripId}/packing`, {
        statusCode: 200,
        body: data.emptyPackingList,
      }).as('getPackingList')
    })
  })

  describe('Modal Open/Close', () => {
    it('should open modal when clicking add button', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="add-packing-item-trigger"]').click()
      cy.get('[data-testid="add-packing-item-dialog"]').should('be.visible')
    })

    it('should close modal when clicking cancel button', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="add-packing-item-trigger"]').click()
      cy.get('[data-testid="add-packing-item-dialog"]').should('be.visible')

      cy.get('[data-testid="add-packing-item-cancel"]').click()
      cy.get('[data-testid="add-packing-item-dialog"]').should('not.exist')
    })

    it('should close modal when clicking outside', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="add-packing-item-trigger"]').click()
      cy.get('[data-testid="add-packing-item-dialog"]').should('be.visible')

      // Click on the overlay (outside the dialog)
      cy.get('body').click(0, 0)
      cy.get('[data-testid="add-packing-item-dialog"]').should('not.exist')
    })
  })

  describe('Form Elements', () => {
    beforeEach(() => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')
      cy.get('[data-testid="add-packing-item-trigger"]').click()
    })

    it('should display all form fields', () => {
      cy.get('[data-testid="add-packing-item-form"]').should('be.visible')
      cy.get('[data-testid="add-packing-item-name"]').should('be.visible')
      cy.get('[data-testid="add-packing-item-categories"]').should('be.visible')
      cy.get('[data-testid="add-packing-item-quantity"]').should('be.visible')
      cy.get('[data-testid="add-packing-item-notes"]').should('be.visible')
    })

    it('should display all 8 category options', () => {
      const categories = [
        'clothing',
        'toiletries',
        'electronics',
        'documents',
        'medicine',
        'accessories',
        'food',
        'other',
      ]

      categories.forEach((category) => {
        cy.get(`[data-testid="add-packing-item-category-${category}"]`).should('be.visible')
      })
    })

    it('should have quantity field with default value 1', () => {
      cy.get('[data-testid="add-packing-item-quantity"]').should('have.value', '1')
    })

    it('should have submit button disabled when name is empty', () => {
      cy.get('[data-testid="add-packing-item-name"]').should('have.value', '')
      cy.get('[data-testid="add-packing-item-submit"]').should('be.disabled')
    })
  })

  describe('Category Selection', () => {
    beforeEach(() => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')
      cy.get('[data-testid="add-packing-item-trigger"]').click()
    })

    it('should highlight selected category', () => {
      cy.get('[data-testid="add-packing-item-category-clothing"]').click()
      cy.get('[data-testid="add-packing-item-category-clothing"]')
        .should('have.class', 'border-blue-500')
        .and('have.class', 'bg-blue-50')
    })

    it('should change selection when clicking different category', () => {
      cy.get('[data-testid="add-packing-item-category-clothing"]').click()
      cy.get('[data-testid="add-packing-item-category-clothing"]').should('have.class', 'border-blue-500')

      cy.get('[data-testid="add-packing-item-category-electronics"]').click()
      cy.get('[data-testid="add-packing-item-category-electronics"]').should('have.class', 'border-blue-500')
      cy.get('[data-testid="add-packing-item-category-clothing"]').should('not.have.class', 'border-blue-500')
    })
  })

  describe('Form Submission', () => {
    beforeEach(() => {
      cy.intercept('POST', `**/api/v1/trips/${tripId}/packing/items`, {
        statusCode: 201,
        body: {
          id: 'new-item-1',
          name: 'Test Item',
          category: 'clothing',
          quantity: 2,
          packed: false,
          order: 0,
        },
      }).as('addPackingItem')
    })

    it('should submit form with valid data', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')
      cy.get('[data-testid="add-packing-item-trigger"]').click()

      // Fill form
      cy.get('[data-testid="add-packing-item-name"]').type('Test Item')
      cy.get('[data-testid="add-packing-item-category-clothing"]').click()
      cy.get('[data-testid="add-packing-item-quantity"]').clear().type('2')
      cy.get('[data-testid="add-packing-item-notes"]').type('Test notes')

      // Submit
      cy.get('[data-testid="add-packing-item-submit"]').should('not.be.disabled')
      cy.get('[data-testid="add-packing-item-submit"]').click()

      cy.wait('@addPackingItem').its('request.body').should('deep.include', {
        name: 'Test Item',
        category: 'clothing',
        quantity: 2,
      })
    })

    it('should close modal after successful submission', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')
      cy.get('[data-testid="add-packing-item-trigger"]').click()

      cy.get('[data-testid="add-packing-item-name"]').type('Test Item')
      cy.get('[data-testid="add-packing-item-submit"]').click()

      cy.wait('@addPackingItem')
      cy.get('[data-testid="add-packing-item-dialog"]').should('not.exist')
    })

    it('should reset form after successful submission', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')
      cy.get('[data-testid="add-packing-item-trigger"]').click()

      cy.get('[data-testid="add-packing-item-name"]').type('Test Item')
      cy.get('[data-testid="add-packing-item-quantity"]').clear().type('5')
      cy.get('[data-testid="add-packing-item-submit"]').click()

      cy.wait('@addPackingItem')

      // Reopen modal
      cy.get('[data-testid="add-packing-item-trigger"]').click()

      // Form should be reset
      cy.get('[data-testid="add-packing-item-name"]').should('have.value', '')
      cy.get('[data-testid="add-packing-item-quantity"]').should('have.value', '1')
    })
  })

  describe('Validation', () => {
    it('should not allow empty name submission', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')
      cy.get('[data-testid="add-packing-item-trigger"]').click()

      cy.get('[data-testid="add-packing-item-name"]').clear()
      cy.get('[data-testid="add-packing-item-submit"]').should('be.disabled')
    })

    it('should not allow whitespace-only name', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')
      cy.get('[data-testid="add-packing-item-trigger"]').click()

      cy.get('[data-testid="add-packing-item-name"]').type('   ')
      cy.get('[data-testid="add-packing-item-submit"]').should('be.disabled')
    })

    it('should allow quantity between 1 and 999', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')
      cy.get('[data-testid="add-packing-item-trigger"]').click()

      cy.get('[data-testid="add-packing-item-quantity"]')
        .should('have.attr', 'min', '1')
        .and('have.attr', 'max', '999')
    })
  })
})
