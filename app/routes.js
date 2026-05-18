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

// ---------------------------------------------------------------------------
// Fine results journey — one question per page. GET requests are served
// automatically by the kit (matching view files under views/fine-flow/);
// POST handlers below capture session data and decide the next page.
// ---------------------------------------------------------------------------

// Helper — render the same view with errors. The page templates read
// `errors.<field>` and pass it as the errorMessage to the relevant
// govuk-* component.
function renderWithErrors (res, view, req, errors) {
  res.render(view, { data: req.session.data, errors })
}

router.post('/fine-flow/fine-amount', (req, res) => {
  const errors = {}
  const raw = (req.body.fineAmount || '').trim()

  if (!raw) {
    errors.fineAmount = { text: 'Enter the fine amount' }
  } else if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    errors.fineAmount = { text: 'Enter an amount in pounds and pence, like 30.40' }
  } else if (parseFloat(raw) <= 0) {
    errors.fineAmount = { text: 'Fine amount must be greater than zero' }
  }

  if (Object.keys(errors).length) {
    return renderWithErrors(res, 'fine-flow/fine-amount', req, errors)
  }
  res.redirect('/fine-flow/collection-order')
})

router.post('/fine-flow/collection-order', (req, res) => {
  const choice = req.session.data.collectionOrderMade
  if (!choice) {
    return renderWithErrors(res, 'fine-flow/collection-order', req, {
      collectionOrderMade: { text: 'Select yes if a collection order has been made' }
    })
  }
  if (choice === 'yes') {
    return res.redirect('/fine-flow/collection-order-type')
  }
  res.redirect('/fine-flow/no-collection-order-reason')
})

router.post('/fine-flow/collection-order-type', (req, res) => {
  if (!req.session.data.collectionOrderType) {
    return renderWithErrors(res, 'fine-flow/collection-order-type', req, {
      collectionOrderType: { text: 'Select the type of collection order' }
    })
  }
  res.redirect('/fine-flow/collection-order-reasons')
})

router.post('/fine-flow/collection-order-reasons', (req, res) => {
  // Reasons are all optional — no validation needed.
  res.redirect('/fine-flow/payment-method-details')
})

router.post('/fine-flow/payment-method-details', (req, res) => {
  const errors = {}
  const type = req.session.data.collectionOrderType

  if (type === 'attachment-of-earnings') {
    if (!req.session.data.employerName) {
      errors.employerName = { text: 'Enter the employer organisation name' }
    }
    if (!req.session.data.employerPostcode) {
      errors.employerPostcode = { text: 'Enter the employer postcode' }
    }
  } else if (type === 'deductions-from-benefit') {
    if (!req.session.data.benefitReason) {
      errors.benefitReason = { text: 'Select a reason for the application' }
    }
  } else {
    // Payment terms branch — radio selection is required
    if (!req.session.data.paymentTerms) {
      errors.paymentTerms = { text: 'Select the payment terms' }
    }
  }

  if (Object.keys(errors).length) {
    return renderWithErrors(res, 'fine-flow/payment-method-details', req, errors)
  }
  res.redirect('/fine-flow/account-consolidated')
})

router.post('/fine-flow/no-collection-order-reason', (req, res) => {
  if (!req.session.data.noCollectionOrderReason) {
    return renderWithErrors(res, 'fine-flow/no-collection-order-reason', req, {
      noCollectionOrderReason: { text: 'Select the reason no collection order has been made' }
    })
  }
  res.redirect('/fine-flow/account-consolidated')
})

router.post('/fine-flow/account-consolidated', (req, res) => {
  // Account consolidation is optional; just continue.
  res.redirect('/fine-flow/check-answers')
})

router.post('/fine-flow/check-answers', (req, res) => {
  // Mark the FO - Fine journey as complete so the main view can render
  // the inline summary under the FO result and switch its status to
  // "Completed".
  req.session.data.fineFlowCompleted = true
  res.redirect('/fine-flow/confirmation')
})
