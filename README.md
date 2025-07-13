# Stripe-HubSpot Integration

This project integrates Stripe payment data with HubSpot CRM. It syncs Stripe invoices and customers to HubSpot contacts and payment records.

## Project Structure

- **index.js**
  Main entry point. Starts the Express server and sets up routes.
- **webhooks/webhookHandler.js**
  Handles incoming webhook events from Stripe and processes them.
- **stripe/historicalSync.js**
  Script to sync historical Stripe invoices to HubSpot. Run manually to backfill data.
- **hubspot/HubspotClient.js**
  Contains logic for interacting with the HubSpot API (creating contacts, payment records, etc.).

## Setup

1. **Clone the repository**

   ```
   git clone
   cd hubStraIn
   ```
2. **Install dependencies**

   ```
   npm install
   ```
3. **Configure environment variables**
   Create a `.env` file in the root directory:

   ```
   STRIPE_SECRET_KEY=your_stripe_secret_key
   HUBSPOT_API_KEY=your_hubspot_api_key
   PORT=3000
   HUBSPOT_OWNER_ID=hubspot_owner_id_to_assing_the_record
   HUBSPOT_CUSTOM_OBJECT_TYPE_ID=your_custom_object_id
   ```
4. **Run the server for Local Dev**

   ```
   npm run dev
   ```

   The API will be available at `http://localhost:3000/`.
5. **Sync historical Stripe invoices**

   ```
   npm run sync-payments
   ```

## File Explanations

- **index.js**
  Loads environment variables, starts Express server, and mounts webhook routes.
- **webhooks/webhookHandler.js**
  Defines API endpoints for Stripe webhooks. Processes events and updates HubSpot.
- **stripe/historicalSync.js**
  Fetches recent Stripe invoices and syncs them to HubSpot as payment records.
- **hubspot/HubspotClient.js**
  Provides methods to find/create HubSpot contacts and create payment records.

## Notes

- Make sure your Stripe and HubSpot API keys are valid.
- The `.env` file should never be committed to source control.
- For development, use `npm run dev` to enable auto-reloading with nodemon.
