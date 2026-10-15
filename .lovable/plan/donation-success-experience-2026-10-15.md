# Donation Success Experience

## What to build
Replace the small inline payment confirmation with a clear, dedicated success state on the donation page after server-side payment verification succeeds.

- Show a confirmation mark, thank-you message, and the verified donation amount and selected cause.
- State accurately that the payment is confirmed and explain the current status of the Section 354(4) certificate email without implying email delivery is already active.
- Provide a clear way to make another donation.
- Keep the existing Razorpay-only checkout and server-side verification flow unchanged.

## Technical details
- Implement the success view within the existing `/donate` route, so it cannot be mistaken for a separate unverified public success URL.
- Store only the verified result needed for the view in component state; show the success view only after `verifyDonationPayment` resolves successfully.
- Validate the preview build and the success-state rendering where practical.
