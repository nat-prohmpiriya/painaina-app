/// <reference types="cypress" />

import type { PackingItemMock } from './e2e'

// Mock Packing List API
Cypress.Commands.add('mockPackingListAPI', (tripId: string, items: PackingItemMock[] = []) => {
  cy.intercept('GET', `**/api/v1/trips/${tripId}/packing`, {
    statusCode: 200,
    body: {
      id: 'packing-list-1',
      tripId,
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }).as('getPackingList')

  cy.intercept('POST', `**/api/v1/trips/${tripId}/packing/items`, (req) => {
    const newItem = {
      id: `item-${Date.now()}`,
      ...req.body,
      packed: false,
      order: items.length,
      createdAt: new Date().toISOString(),
    }
    req.reply({
      statusCode: 201,
      body: newItem,
    })
  }).as('addPackingItem')

  cy.intercept('PATCH', `**/api/v1/trips/${tripId}/packing/items/*`, (req) => {
    req.reply({
      statusCode: 200,
      body: { ...req.body, id: req.url.split('/').pop() },
    })
  }).as('updatePackingItem')

  cy.intercept('DELETE', `**/api/v1/trips/${tripId}/packing/items/*`, {
    statusCode: 204,
  }).as('deletePackingItem')

  cy.intercept('POST', `**/api/v1/trips/${tripId}/packing/items/*/toggle`, (req) => {
    const itemId = req.url.split('/').slice(-2)[0]
    const item = items.find((i) => i.id === itemId)
    req.reply({
      statusCode: 200,
      body: { ...item, packed: !item?.packed },
    })
  }).as('togglePackingItem')

  cy.intercept('POST', `**/api/v1/trips/${tripId}/packing/reorder`, {
    statusCode: 200,
    body: { success: true },
  }).as('reorderPackingItems')

  cy.intercept('POST', `**/api/v1/trips/${tripId}/packing/template`, {
    statusCode: 200,
    body: { success: true, itemsAdded: 10 },
  }).as('applyTemplate')
})

// Mock Packing Templates API
Cypress.Commands.add('mockPackingTemplatesAPI', () => {
  cy.intercept('GET', '**/api/v1/packing/templates', {
    statusCode: 200,
    body: [
      {
        id: 'essential',
        name: 'Essential Items',
        nameTh: 'ของจำเป็น',
        items: [
          { name: 'Passport', category: 'documents', quantity: 1 },
          { name: 'Phone charger', category: 'electronics', quantity: 1 },
          { name: 'Toothbrush', category: 'toiletries', quantity: 1 },
          { name: 'T-shirt', category: 'clothing', quantity: 3 },
          { name: 'Underwear', category: 'clothing', quantity: 3 },
        ],
      },
      {
        id: 'beach',
        name: 'Beach Trip',
        nameTh: 'ทริปทะเล',
        items: [
          { name: 'Sunscreen', category: 'toiletries', quantity: 1 },
          { name: 'Swimsuit', category: 'clothing', quantity: 2 },
          { name: 'Sunglasses', category: 'accessories', quantity: 1 },
          { name: 'Beach towel', category: 'accessories', quantity: 1 },
        ],
      },
      {
        id: 'mountain',
        name: 'Mountain Trip',
        nameTh: 'ทริปภูเขา',
        items: [
          { name: 'Hiking boots', category: 'clothing', quantity: 1 },
          { name: 'Rain jacket', category: 'clothing', quantity: 1 },
          { name: 'First aid kit', category: 'medicine', quantity: 1 },
        ],
      },
    ],
  }).as('getPackingTemplates')
})

// Mock Auth (Clerk)
Cypress.Commands.add('mockAuth', () => {
  cy.intercept('GET', '**/v1/client*', {
    statusCode: 200,
    body: {
      response: {
        sessions: [
          {
            id: 'sess_123',
            status: 'active',
            user: {
              id: 'user_123',
              firstName: 'Test',
              lastName: 'User',
              emailAddresses: [{ emailAddress: 'test@example.com' }],
            },
          },
        ],
      },
    },
  })
})
