import { test, expect } from '@playwright/test'

test.describe('Dashboard Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/models', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          models: [
            {
              id: 1,
              display_name: 'Qwen2.5-7B-Instruct-Q4_K_M.gguf',
              file_path: '/models/Qwen2.5-7B-Instruct-Q4_K_M.gguf',
              file_size: 4294967296,
              status: 'active',
              last_used: new Date().toISOString(),
              architecture: 'qwen2',
              parameters: 7000000000
            },
            {
              id: 2,
              display_name: 'llama-3.1-8B-Instruct-Q4_K_M.gguf',
              file_path: '/models/llama-3.1-8B-Instruct-Q4_K_M.gguf',
              file_size: 5368709120,
              status: 'inactive',
              last_used: null,
              architecture: 'llama',
              parameters: 8000000000
            }
          ]
        })
      })
    })

    await page.route('**/api/models/discover', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ discovered: 3, added: 2 })
      })
    })

    // Navigate to dashboard
    await page.goto('http://localhost:3000')
  })

  test('loads the dashboard and displays models', async ({ page }) => {
    // Wait for the dashboard to load
    await expect(page.locator('h2')).toContainText('Gestion des Modèles')
    
    // Check that models are displayed
    await expect(page.locator('[data-testid="model-card"]')).toHaveCount(2)
    
    // Verify model information is displayed
    await expect(page.locator('text=Qwen2.5-7B-Instruct-Q4_K_M.gguf')).toBeVisible()
    await expect(page.locator('text=llama-3.1-8B-Instruct-Q4_K_M.gguf')).toBeVisible()
  })

  test('adds a new model through the form', async ({ page }) => {
    // Click add model button
    await page.click('button:has-text("Ajouter Modèle")')
    
    // Wait for dialog to appear
    await expect(page.locator('.el-dialog')).toBeVisible()
    
    // Fill the form
    await page.fill('input[placeholder="Nom du modèle"]', 'Test Model')
    await page.fill('input[placeholder="Chemin du fichier"]', '/models/test.gguf')
    
    // Mock successful model creation
    await page.route('**/api/models', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: 3,
            display_name: 'Test Model',
            file_path: '/models/test.gguf',
            status: 'active'
          })
        })
      }
    })
    
    // Submit the form
    await page.click('button:has-text("Ajouter")')
    
    // Verify success message
    await expect(page.locator('.el-message--success')).toBeVisible()
  })

  test('searches and filters models', async ({ page }) => {
    // Search for a specific model
    await page.fill('input[placeholder="Rechercher un modèle..."]', 'Qwen')
    
    // Verify search results
    await expect(page.locator('text=Qwen2.5-7B-Instruct-Q4_K_M.gguf')).toBeVisible()
    await expect(page.locator('text=llama-3.1-8B-Instruct-Q4_K_M.gguf')).not.toBeVisible()
    
    // Clear search and test status filter
    await page.fill('input[placeholder="Rechercher un modèle..."]', '')
    await page.selectOption('select[placeholder="Statut"]', 'active')
    
    // Should only show active models
    await expect(page.locator('[data-testid="model-card"]')).toHaveCount(1)
  })

  test('discovers new models automatically', async ({ page }) => {
    // Click discover button
    await page.click('button:has-text("Découvrir Modèles")')
    
    // Verify loading state
    await expect(page.locator('button:has-text("Découvrir Modèles")')).toHaveAttribute('loading')
    
    // Wait for discovery to complete
    await expect(page.locator('button:has-text("Découvrir Modèles")')).not.toHaveAttribute('loading')
    
    // Check success message
    await expect(page.locator('.el-message--success')).toBeVisible()
  })

  test('edits an existing model', async ({ page }) => {
    // Click edit button on first model
    await page.click('[data-testid="model-action"]:first-child button[title="Modifier"]')
    
    // Wait for edit dialog
    await expect(page.locator('.el-dialog')).toBeVisible()
    
    // Modify model name
    await page.fill('input[placeholder="Nom du modèle"]', 'Updated Model Name')
    
    // Mock successful update
    await page.route('**/api/models/**', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: 1,
            display_name: 'Updated Model Name',
            status: 'active'
          })
        })
      }
    })
    
    // Save changes
    await page.click('button:has-text("Sauvegarder")')
    
    // Verify update
    await expect(page.locator('text=Updated Model Name')).toBeVisible()
  })

  test('deletes a model with confirmation', async ({ page }) => {
    // Mock confirmation dialog
    page.on('dialog', async dialog => {
      await dialog.accept()
    })
    
    // Click delete button on first model
    await page.click('[data-testid="model-action"]:first-child button[title="Supprimer"]')
    
    // Mock successful deletion
    await page.route('**/api/models/**', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })
    
    // Verify model is removed
    await expect(page.locator('[data-testid="model-card"]')).toHaveCount(1)
  })

  test('handles network errors gracefully', async ({ page }) => {
    // Mock failed API response
    await page.route('**/api/models', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })
    
    // Refresh page to trigger API call
    await page.reload()
    
    // Check error handling
    await expect(page.locator('.el-message--error')).toBeVisible()
  })

  test('navigates between dashboard views', async ({ page }) => {
    // Test navigation to Audio view
    await page.click('a[href="/audio"]')
    await expect(page.locator('h2')).toContainText('Traitement Audio')
    
    // Test navigation to Proxy view
    await page.click('a[href="/proxy"]')
    await expect(page.locator('h2')).toContainText('Configuration Proxy')
    
    // Test navigation to Config view
    await page.click('a[href="/config"]')
    await expect(page.locator('h2')).toContainText('Configuration Avancée')
    
    // Test navigation back to Dashboard
    await page.click('a[href="/"]')
    await expect(page.locator('h2')).toContainText('Gestion des Modèles')
  })

  test('displays real-time statistics', async ({ page }) => {
    // Mock statistics API
    await page.route('**/api/stats', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalModels: 2,
          activeModels: 1,
          totalSize: 9663676416, // ~9GB
          averageSize: 4831838208
        })
      })
    })
    
    // Wait for statistics to load
    await expect(page.locator('[data-testid="stat-card"]')).toHaveCount(4)
    
    // Verify statistics values
    await expect(page.locator('[data-testid="stat-card"] >> text=2')).toBeVisible()
    await expect(page.locator('[data-testid="stat-card"] >> text=1')).toBeVisible()
  })
})