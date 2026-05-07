//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here

// Common Platform "Enter results" page
router.get('/enter-results', (req, res) => {
  res.render('enter-results')
})

// POST handler — for the prototype, just redirect back to the page.
router.post('/enter-results', (req, res) => {
  res.redirect('/enter-results')
})
