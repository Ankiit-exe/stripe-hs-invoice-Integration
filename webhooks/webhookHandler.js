// webhooks/webhookHandler.js
require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const HubspotClient= require('../hubspot/hubspotClient');
const hsClient = new HubspotClient();

const router = express.Router();

// Use raw body parser for Stripe webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  // console.log(`Received webhook: ${req.body.toString()}`);
 
  try {
    event = JSON.parse(req.body.toString());
  } catch (err) {
    console.log(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error`);
  }

  if (['invoice.paid', 'invoice.payment_failed'].includes(event.type)) {
    const invoice = event.data.object;
    console.log(`Processing event: ${event.type} for invoice ID: ${invoice.id}`);
    // find or create invoice or contact in hubspot 

    const hsCustomerRes = await hsClient.findOrCreateUpdatePaymentsByInvoiced(invoice, event.type); ;
  }

  res.status(200).send('OK');
});


module.exports = router;
