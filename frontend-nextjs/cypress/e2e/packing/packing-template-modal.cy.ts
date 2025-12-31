/// <reference types="cypress" />

describe('Packing Template Modal', () => {
  const tripId = 'trip-123'

  beforeEach(() => {
    cy.fixture('packing').then((data) => {
      cy.intercept('GET', `**/api/v1/trips/${tripId}/packing`, {
        statusCode: 200,
        body: data.emptyPackingList,
      }).as('getPackingList')

      cy.intercept('GET', '**/api/v1/packing/templates', {
        statusCode: 200,
        body: data.templates,
      }).as('getTemplates')
    })
  })

  describe('Modal Open/Close', () => {
    it('should open modal when clicking template button', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()
      cy.get('[data-testid="packing-template-dialog"]').should('be.visible')
    })

    it('should close modal when clicking cancel button', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()
      cy.get('[data-testid="packing-template-dialog"]').should('be.visible')

      cy.get('[data-testid="packing-template-cancel"]').click()
      cy.get('[data-testid="packing-template-dialog"]').should('not.exist')
    })
  })

  describe('Template List', () => {
    it('should display template list', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()
      cy.wait('@getTemplates')

      cy.get('[data-testid="packing-template-list"]').should('be.visible')
    })

    it('should display all templates from API', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()
      cy.wait('@getTemplates')

      cy.get('[data-testid="packing-template-item-essential"]').should('be.visible')
      cy.get('[data-testid="packing-template-item-beach"]').should('be.visible')
    })

    it('should display template name and item count', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()
      cy.wait('@getTemplates')

      cy.get('[data-testid="packing-template-name-essential"]')
        .should('be.visible')
        .and('contain.text', 'Essential Items')

      cy.get('[data-testid="packing-template-count-essential"]')
        .should('be.visible')
        .and('contain.text', '5')
    })

    it('should display item preview', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()
      cy.wait('@getTemplates')

      cy.get('[data-testid="packing-template-preview-essential"]')
        .should('be.visible')
        .and('contain.text', 'Passport')
        .and('contain.text', 'Phone charger')
    })

    it('should show loading skeleton while fetching templates', () => {
      cy.intercept('GET', '**/api/v1/packing/templates', {
        delay: 1000,
        statusCode: 200,
        body: [],
      }).as('getTemplatesDelayed')

      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()

      cy.get('[data-testid="packing-template-skeleton-0"]').should('be.visible')
      cy.get('[data-testid="packing-template-skeleton-1"]').should('be.visible')
      cy.get('[data-testid="packing-template-skeleton-2"]').should('be.visible')
    })
  })

  describe('Template Selection', () => {
    it('should highlight selected template', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()
      cy.wait('@getTemplates')

      cy.get('[data-testid="packing-template-item-essential"]').click()
      cy.get('[data-testid="packing-template-item-essential"]')
        .should('have.class', 'border-blue-500')
        .and('have.class', 'bg-blue-50')
    })

    it('should show checkmark on selected template', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()
      cy.wait('@getTemplates')

      cy.get('[data-testid="packing-template-item-essential"]').click()
      cy.get('[data-testid="packing-template-selected-essential"]').should('be.visible')
    })

    it('should change selection when clicking different template', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()
      cy.wait('@getTemplates')

      cy.get('[data-testid="packing-template-item-essential"]').click()
      cy.get('[data-testid="packing-template-selected-essential"]').should('be.visible')

      cy.get('[data-testid="packing-template-item-beach"]').click()
      cy.get('[data-testid="packing-template-selected-beach"]').should('be.visible')
      cy.get('[data-testid="packing-template-selected-essential"]').should('not.exist')
    })

    it('should have apply button disabled when no template selected', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()
      cy.wait('@getTemplates')

      cy.get('[data-testid="packing-template-apply"]').should('be.disabled')
    })

    it('should enable apply button when template is selected', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()
      cy.wait('@getTemplates')

      cy.get('[data-testid="packing-template-item-essential"]').click()
      cy.get('[data-testid="packing-template-apply"]').should('not.be.disabled')
    })
  })

  describe('Apply Template', () => {
    beforeEach(() => {
      cy.intercept('POST', `**/api/v1/trips/${tripId}/packing/template`, {
        statusCode: 200,
        body: { success: true, itemsAdded: 5 },
      }).as('applyTemplate')
    })

    it('should apply selected template', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()
      cy.wait('@getTemplates')

      cy.get('[data-testid="packing-template-item-essential"]').click()
      cy.get('[data-testid="packing-template-apply"]').click()

      cy.wait('@applyTemplate').its('request.body').should('deep.include', {
        templateId: 'essential',
      })
    })

    it('should close modal after applying template', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()
      cy.wait('@getTemplates')

      cy.get('[data-testid="packing-template-item-essential"]').click()
      cy.get('[data-testid="packing-template-apply"]').click()

      cy.wait('@applyTemplate')
      cy.get('[data-testid="packing-template-dialog"]').should('not.exist')
    })

    it('should show loading state while applying template', () => {
      cy.intercept('POST', `**/api/v1/trips/${tripId}/packing/template`, {
        delay: 1000,
        statusCode: 200,
        body: { success: true },
      }).as('applyTemplateDelayed')

      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()
      cy.wait('@getTemplates')

      cy.get('[data-testid="packing-template-item-essential"]').click()
      cy.get('[data-testid="packing-template-apply"]').click()

      cy.get('[data-testid="packing-template-apply"]')
        .should('be.disabled')
        .and('contain.text', 'Applying')
    })
  })

  describe('Error Handling', () => {
    it('should handle template loading error gracefully', () => {
      cy.intercept('GET', '**/api/v1/packing/templates', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('getTemplatesError')

      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()
      cy.wait('@getTemplatesError')

      // Modal should still be visible even if templates fail to load
      cy.get('[data-testid="packing-template-dialog"]').should('be.visible')
    })

    it('should handle apply template error', () => {
      cy.intercept('POST', `**/api/v1/trips/${tripId}/packing/template`, {
        statusCode: 500,
        body: { error: 'Failed to apply template' },
      }).as('applyTemplateError')

      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-template-trigger"]').click()
      cy.wait('@getTemplates')

      cy.get('[data-testid="packing-template-item-essential"]').click()
      cy.get('[data-testid="packing-template-apply"]').click()

      cy.wait('@applyTemplateError')
      // Modal should remain open on error
      cy.get('[data-testid="packing-template-dialog"]').should('be.visible')
    })
  })
})
