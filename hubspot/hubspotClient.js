const hubspot = require('@hubspot/api-client');
const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });
const customObjectTypeId = process.env.HUBSPOT_CUSTOM_OBJECT_TYPE_ID || '2-47111273';
const hubspotOwnerId = process.env.HUBSPOT_OWNER_ID || null; 

class HubspotClient {

  // Method to find or create a contact by Stripe customer ID or custom email
  async findOrCreateContactByStripeCustomerId(invoice) {
    try {
      const searchResponse = await hubspotClient.crm.contacts.searchApi.doSearch({
        filterGroups: [{
          filters: [{ propertyName: "stripe_customer_id", operator: "EQ", value: invoice.customer }]
        }],
        properties: ["email"],
        limit: 1
      });

      if (searchResponse.results.length > 0) return searchResponse.results[0].id;

      // Fallback: search by email
      const emailSearch = await hubspotClient.crm.contacts.searchApi.doSearch({
        filterGroups: [{
          filters: [{ propertyName: "email", operator: "EQ", value: invoice.customer_email }]
        }],
        properties: ["email"],
        limit: 1
      });

      if (emailSearch.results.length > 0) return emailSearch.results[0].id;
      const fullName = invoice.customer_name ?? '';
      const [firstname, ...lastNameParts] = fullName.split(" ");
      const lastname = lastNameParts.join(" ");
      const email = invoice.customer_email;
      // Create contact
      const createResp = await hubspotClient.crm.contacts.basicApi.create({
        properties: {
          email,
          firstname,
          lastname,
          stripe_customer_id: invoice.customer,
          hubspot_owner_id: hubspotOwnerId || null,
        }
      });

      return createResp.id;
    } catch (err) {
      console.error("Contact lookup/create error", err.message);
    }
  }

  async createPaymentRecord(data, contactId) {
    try {
      
      const createResp = await hubspotClient.crm.objects.basicApi.create(customObjectTypeId, { properties:data});

      await hubspotClient.crm.associations.v4.basicApi.create('contacts', contactId, customObjectTypeId, createResp.id, [
        { associationTypeId: 17 , "associationCategory": "USER_DEFINED",}
      ]);

      console.log(`✅ Payment record created for ${data.invoice_id}`);
      return createResp.id;
    } catch (err) {
      console.error(`❌ Error creating payment for ${data.invoice_id}`, err.message);
    }
  }

async findOrCreateUpdatePaymentsByInvoiced(invoice, event = null) {
    try {
     
      const searchResponse = await hubspotClient.crm.objects.searchApi.doSearch(customObjectTypeId, {
        filterGroups: [{
          filters: [{ propertyName: "invoice_id", operator: "EQ", value: invoice.id }]
        }],
        properties: ["email"],
        limit: 1
      });
      
      if (searchResponse.results.length > 0) {
        //update payment record
        const paymentId = searchResponse.results[0].id;
        const updateResp = await hubspotClient.crm.objects.basicApi.update(customObjectTypeId, paymentId, {
          properties: {
            amount: invoice.amount_due / 100,
            status: event === 'invoice.paid'
                      ? 'paid'
                      : event === 'invoice.payment_failed'
                      ? 'uncollectible'
                      : 'open',
            due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
            paid_at: invoice.status === 'paid' ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : null,
            invoice_pdf: invoice.hosted_invoice_url,
            stripe_customer_id: invoice.customer,
            currency: invoice.currency.toUpperCase(),
          }
        });
        console.log(`✅ Payment record updated for invoice ${invoice.id}`);
        return paymentId;
      }else {
        // Create new payment record
        const contactId = await this.findOrCreateContactByStripeCustomerId(invoice);
        if (!contactId) {
          console.error(`No contact found or created for invoice ${invoice.id}`);
          return null;
        }
        const paymentData = {
          invoice_id: invoice.id,
          stripe_customer_id: invoice.customer,
          amount: invoice.amount_due / 100,
          currency: invoice.currency.toUpperCase(),
          status: event === 'invoice.paid'
                      ? 'paid'
                      : event === 'invoice.payment_failed'
                      ? 'uncollectible'
                      : 'open',
          due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
          paid_at: invoice.status === 'paid' ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : null,
          invoice_pdf: invoice.hosted_invoice_url,
        };
        return await this.createPaymentRecord(paymentData, contactId);
      }
    } catch (err) {
      console.error("Payment Create Update Done....", err.message);
    }
  }
}
module.exports = HubspotClient;

