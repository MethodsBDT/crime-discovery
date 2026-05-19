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
// Inline results entry — alternative variant where the FO fine details
// are entered as an inline form on the main page (no chunked journey).
//
// State model:
//   data.foSelected         — true once the user has added FO to the list.
//     Drives whether FO appears in the result list at all.
//   data.fineFlowCompleted  — true once the user has saved the form at
//     least once. Switches the FO section from form to summary.
//   data.fineFlowEditing    — true while the user is editing an already-
//     saved fine result. Toggles the form back on without losing FO.
// ---------------------------------------------------------------------------

// Add FO to the result list. Triggered from the autocomplete onConfirm
// when the user picks "FO - Fine".
router.post('/inline-results/add-fo', (req, res) => {
  req.session.data.foSelected = true
  // Brand-new selection — start in form mode.
  req.session.data.fineFlowCompleted = false
  req.session.data.fineFlowEditing = false
  res.redirect('/inline-results')
})

// Remove FO from the list (clears all related state).
router.post('/inline-results/remove-fo', (req, res) => {
  req.session.data.foSelected = false
  req.session.data.fineFlowCompleted = false
  req.session.data.fineFlowEditing = false
  res.redirect('/inline-results')
})
router.post('/inline-results', (req, res) => {
  const errors = {}
  const raw = (req.body.fineAmount || '').trim()

  if (!raw) {
    errors.fineAmount = { text: 'Enter the fine amount' }
  } else if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    errors.fineAmount = { text: 'Enter an amount in pounds and pence, like 30.40' }
  } else if (parseFloat(raw) <= 0) {
    errors.fineAmount = { text: 'Fine amount must be greater than zero' }
  }

  if (!req.body.collectionOrderMade) {
    errors.collectionOrderMade = { text: 'Select yes if a collection order has been made' }
  }

  if (Object.keys(errors).length) {
    return res.render('inline-results', { data: req.session.data, errors })
  }

  req.session.data.fineFlowCompleted = true
  req.session.data.fineFlowEditing = false
  res.redirect('/inline-results')
})

// Clicking "Change result details" reopens the inline form pre-filled with
// the previously-saved values. fineFlowCompleted stays true so FO remains
// in the result list.
router.get('/inline-results/edit', (req, res) => {
  req.session.data.fineFlowEditing = true
  res.redirect('/inline-results')
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
  // Reasons are all optional. Branch to the right entry page for the
  // collection-order type the user picked earlier.
  const type = req.session.data.collectionOrderType
  if (type === 'make-payments-as-ordered') return res.redirect('/fine-flow/payment-terms-type')
  if (type === 'attachment-of-earnings')   return res.redirect('/fine-flow/employer-details')
  if (type === 'deductions-from-benefit')  return res.redirect('/fine-flow/dwp-application')
  // Fallback — shouldn't happen if collection-order-type validation runs.
  res.redirect('/fine-flow/account-consolidated')
})

// Legacy /fine-flow/payment-method-details URL — redirect anyone with a
// stale tab open to the right branch entry. POST keeps validating in case
// the old page was bookmarked or auto-submitted.
router.get('/fine-flow/payment-method-details', (req, res) => {
  const type = req.session.data.collectionOrderType
  if (type === 'make-payments-as-ordered') return res.redirect('/fine-flow/payment-terms-type')
  if (type === 'attachment-of-earnings')   return res.redirect('/fine-flow/employer-details')
  if (type === 'deductions-from-benefit')  return res.redirect('/fine-flow/dwp-application')
  res.redirect('/fine-flow/account-consolidated')
})

// ---- Make payments as ordered → payment terms ----
router.post('/fine-flow/payment-terms-type', (req, res) => {
  if (!req.session.data.paymentTermsType) {
    return renderWithErrors(res, 'fine-flow/payment-terms-type', req, {
      paymentTermsType: { text: 'Select the payment terms ordered by the court' }
    })
  }
  res.redirect('/fine-flow/payment-terms-details')
})

router.post('/fine-flow/payment-terms-details', (req, res) => {
  // Validation here is light for the prototype — required-fields would be
  // type-specific. Leave optional for now; tighten when the journey is
  // tested with real users.
  res.redirect('/fine-flow/account-consolidated')
})

// ---- Attachment of earnings → employer details ----
router.post('/fine-flow/employer-details', (req, res) => {
  const errors = {}
  if (!req.session.data.employerName) {
    errors.employerName = { text: 'Enter the employer organisation name' }
  }
  if (!req.session.data.employerAddress1) {
    errors.employerAddress1 = { text: 'Enter the first line of the employer address' }
  }
  if (!req.session.data.employerPostcode) {
    errors.employerPostcode = { text: 'Enter the employer postcode' }
  }
  if (Object.keys(errors).length) {
    return renderWithErrors(res, 'fine-flow/employer-details', req, errors)
  }
  res.redirect('/fine-flow/account-consolidated')
})

// ---- Deductions from benefit → DWP + Reserve terms ----
router.post('/fine-flow/dwp-application', (req, res) => {
  const errors = {}
  if (!req.session.data.benefitReason) {
    errors.benefitReason = { text: 'Select a reason for the application' }
  }
  if (!req.session.data.dwpApNumber) {
    errors.dwpApNumber = { text: 'Enter the DWP AP number' }
  }
  if (Object.keys(errors).length) {
    return renderWithErrors(res, 'fine-flow/dwp-application', req, errors)
  }
  res.redirect('/fine-flow/reserve-terms-type')
})

router.post('/fine-flow/reserve-terms-type', (req, res) => {
  if (!req.session.data.reserveTermsType) {
    return renderWithErrors(res, 'fine-flow/reserve-terms-type', req, {
      reserveTermsType: { text: 'Select the reserve terms ordered by the court' }
    })
  }
  res.redirect('/fine-flow/reserve-terms-details')
})

router.post('/fine-flow/reserve-terms-details', (req, res) => {
  // Same as payment-terms-details — soft-validated for now.
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
