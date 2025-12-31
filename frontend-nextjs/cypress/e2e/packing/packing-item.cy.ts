/// <reference types="cypress" />

describe('Packing Item', () => {
  const tripId = 'trip-123'

  beforeEach(() => {
    cy.mockPackingTemplatesAPI()
    cy.fixture('packing').then((data) => {
      cy.intercept('GET', `**/api/v1/trips/${tripId}/packing`, {
        statusCode: 200,
        body: data.packingListWithItems,
      }).as('getPackingList')
    })
  })

  describe('Item Display', () => {
    it('should display item with name and checkbox', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-item-item-1"]').should('be.visible')
      cy.get('[data-testid="packing-item-checkbox-item-1"]').should('be.visible')
      cy.get('[data-testid="packing-item-name-item-1"]').should('contain.text', 'T-shirt')
    })

    it('should display quantity badge for items with quantity > 1', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      // Item with quantity 3
      cy.get('[data-testid="packing-item-quantity-item-1"]').should('be.visible')
      cy.get('[data-testid="packing-item-quantity-item-1"]').should('contain.text', 'x3')

      // Item with quantity 1 should not show badge
      cy.get('[data-testid="packing-item-quantity-item-2"]').should('not.exist')
    })

    it('should display category icon', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-item-icon-item-1"]').should('be.visible')
    })

    it('should show packed items with strikethrough style', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      // item-2 is packed
      cy.get('[data-testid="packing-item-name-item-2"]').should('have.class', 'line-through')
    })
  })

  describe('Item Actions', () => {
    it('should show edit and delete buttons on hover', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-item-item-1"]').realHover()
      cy.get('[data-testid="packing-item-actions-item-1"]').should('be.visible')
      cy.get('[data-testid="packing-item-edit-btn-item-1"]').should('be.visible')
      cy.get('[data-testid="packing-item-delete-btn-item-1"]').should('be.visible')
    })

    it('should show drag handle on hover', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-item-item-1"]').realHover()
      cy.get('[data-testid="packing-item-drag-item-1"]').should('be.visible')
    })
  })

  describe('Edit Mode', () => {
    it('should enter edit mode when clicking edit button', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-item-item-1"]').realHover()
      cy.get('[data-testid="packing-item-edit-btn-item-1"]').click()

      cy.get('[data-testid="packing-item-edit-form-item-1"]').should('be.visible')
      cy.get('[data-testid="packing-item-edit-name-item-1"]').should('be.visible')
      cy.get('[data-testid="packing-item-edit-quantity-item-1"]').should('be.visible')
    })

    it('should update item when editing and pressing Enter', () => {
      cy.intercept('PATCH', `**/api/v1/trips/${tripId}/packing/items/item-1`, {
        statusCode: 200,
        body: { id: 'item-1', name: 'New T-shirt', quantity: 5 },
      }).as('updateItem')

      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-item-item-1"]').realHover()
      cy.get('[data-testid="packing-item-edit-btn-item-1"]').click()

      cy.get('[data-testid="packing-item-edit-name-item-1"]')
        .clear()
        .type('New T-shirt')
      cy.get('[data-testid="packing-item-edit-quantity-item-1"]')
        .clear()
        .type('5{enter}')

      cy.wait('@updateItem')
    })

    it('should cancel edit when pressing Escape', () => {
      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-item-item-1"]').realHover()
      cy.get('[data-testid="packing-item-edit-btn-item-1"]').click()

      cy.get('[data-testid="packing-item-edit-name-item-1"]')
        .clear()
        .type('Changed name{esc}')

      // Should exit edit mode without saving
      cy.get('[data-testid="packing-item-edit-form-item-1"]').should('not.exist')
      cy.get('[data-testid="packing-item-name-item-1"]').should('contain.text', 'T-shirt')
    })
  })

  describe('Delete Item', () => {
    it('should delete item when clicking delete button', () => {
      cy.intercept('DELETE', `**/api/v1/trips/${tripId}/packing/items/item-1`, {
        statusCode: 204,
      }).as('deleteItem')

      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-item-item-1"]').realHover()
      cy.get('[data-testid="packing-item-delete-btn-item-1"]').click()

      cy.wait('@deleteItem')
    })
  })

  describe('Toggle Packed Status', () => {
    it('should toggle packed status when clicking checkbox', () => {
      cy.intercept('POST', `**/api/v1/trips/${tripId}/packing/items/item-1/toggle`, {
        statusCode: 200,
        body: { id: 'item-1', packed: true },
      }).as('toggleItem')

      cy.visit(`/en/trips/${tripId}`)
      cy.wait('@getPackingList')

      cy.get('[data-testid="packing-item-checkbox-item-1"]').click()
      cy.wait('@toggleItem')
    })
  })
})
