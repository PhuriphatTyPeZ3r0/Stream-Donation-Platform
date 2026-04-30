import express from 'express';
import cors from 'cors';
import { createDonation, getDonationHistory, getDonationStatus } from './controllers/donation.controller';
import { getSettings, saveSettings } from './controllers/settings.controller';

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/donations', createDonation);
app.get('/api/donations/history/:streamerId', getDonationHistory);
app.get('/api/donations/status/:paymentRef', getDonationStatus);

// Settings Routes
app.get('/api/settings/:streamerId', getSettings);
app.post('/api/settings', saveSettings);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Donation Service is running on port ${PORT}`);
});

export default app;