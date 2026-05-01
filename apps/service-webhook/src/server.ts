import 'dotenv/config';
import express from 'express';
import { handlePaymentCallback } from './controllers/webhook.controller';

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());

// Webhook Routes
app.post('/webhook/payment', handlePaymentCallback);

app.listen(port, () => {
    console.log(`Webhook Service running on port ${port}`);
});