# Architecture Decisions

- Keep Razorpay order creation and payment verification in TanStack Start server functions so private credentials and donation status updates never reach the browser.
- Generate donation acknowledgement PDFs in a client-safe utility from payment-verified details, and label them as non-tax certificates until official foundation particulars are supplied.