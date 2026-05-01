import express from 'express';
import cors from 'cors';
import { createDonation, getDonationHistory, getDonationStatus } from './controllers/donation.controller';
import { getSettings, saveSettings } from './controllers/settings.controller';
import { registerUser, loginUser } from './controllers/auth.controller';
import { getProfile, updateProfile } from './controllers/profile.controller';
import { getPublicStreamerProfile } from './controllers/public.controller';

const app = express();
app.use(cors());
app.use(express.json());

// Public Routes
app.get('/api/public/streamer/:username', getPublicStreamerProfile);

// Routes
app.post('/api/donations', createDonation);
app.get('/api/donations/history/:streamerId', getDonationHistory);
app.get('/api/donations/status/:paymentRef', getDonationStatus);

// Settings Routes
app.get('/api/settings/:streamerId', getSettings);
app.post('/api/settings', saveSettings);

// Profile Routes
app.get('/api/profile/:userId', getProfile);
app.put('/api/profile', updateProfile);

// Auth Routes
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Donation Service is running on port ${PORT}`);
});

export default app;