require('dotenv').config();
const express = require('express');
const webhookRoutes = require('./webhooks/webhookHandler');

const app = express();
app.use('/api', webhookRoutes);

app.get('/', (req, res) => {
  res.send("Welcome to the Stripe-HubSpot Integration API!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
