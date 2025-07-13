require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const HubspotClient = require('../hubspot/hubspotClient');
const hsClient = new HubspotClient();


async function syncInvoices() {
  const invoices = await stripe.invoices.list({ limit: 10 }); 

  for (const invoice of invoices.data) {
    // Search customer by email or custom id in hubspot
    const hsCustomerRes = await hsClient.findOrCreateContactByStripeCustomerId(invoice);

    if (!hsCustomerRes) {
      console.error(`Failed to find or create contact for customer ID: ${invoice.customer}`);
      continue; 
    }

    // if customer found then create payment record for that with association to contact
    const paymentData = {
      invoice_id: invoice.id,
      stripe_customer_id: invoice.customer,
      amount: invoice.amount_due,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status == 'paid' ? 'paid' : 'open',
      due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
      paid_at: invoice.status === 'paid' ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : null,
      invoice_pdf: invoice.hosted_invoice_url,
    };

    // Create payment record in HubSpot    
    await hsClient.createPaymentRecord(paymentData, hsCustomerRes);
    console.log(`✅ Payment record created for invoice ${invoice.id} associated with contact ID ${hsCustomerRes}`);
  }

  console.log("Historical sync complete.");
}

syncInvoices();