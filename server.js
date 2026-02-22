const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from the root directory

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('CRITICAL: MONGODB_URI is not defined in environment variables!');
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Successfully'))
    .catch(err => {
        console.error('MongoDB Connection Error Details:', err.message);
        if (err.message.includes('IP not whitelisted')) {
            console.error('ACTION REQUIRED: Please whitelist 0.0.0.0/0 in MongoDB Atlas Network Access.');
        }
    });

// Health Check Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/status', (req, res) => {
    res.json({ status: 'success', message: 'Backend is running and connected to MongoDB' });
});

// Registration Schema
const registrationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    rollNumber: { type: String, required: true, unique: true },
    college: { type: String, required: true },
    department: { type: String, required: true },
    year: { type: String, required: true },
    events: { type: String, required: true },
    transactionId: { type: String, required: true, unique: true },
    paymentMode: { type: String, required: true },
    paymentStatus: { type: String, default: 'Pending' },
    registrationDate: { type: Date, default: Date.now }
});

const Registration = mongoose.model('Registration', registrationSchema);

// API Routes
app.post('/api/register', async (req, res) => {
    try {
        const registrationData = req.body;

        // Enhanced validation
        const requiredFields = ['name', 'email', 'phone', 'rollNumber', 'college', 'department', 'year', 'events', 'transactionId', 'paymentMode'];
        for (const field of requiredFields) {
            if (!registrationData[field] || (typeof registrationData[field] === 'string' && registrationData[field].trim() === '')) {
                return res.status(400).json({ status: 'error', message: `Field ${field} is required` });
            }
        }

        // Optional: More specific validation for email format
        if (!/\S+@\S+\.\S+/.test(registrationData.email)) {
            return res.status(400).json({ status: 'error', message: 'A valid email is required' });
        }

        // Check for existing registration with the same email, rollNumber, or transactionId
        const existingEmail = await Registration.findOne({ email: registrationData.email });
        if (existingEmail) {
            return res.status(409).json({ status: 'error', message: 'This email has already been registered.' });
        }

        const existingRollNumber = await Registration.findOne({ rollNumber: registrationData.rollNumber });
        if (existingRollNumber) {
            return res.status(409).json({ status: 'error', message: 'This Roll Number has already been registered.' });
        }

        const existingTransaction = await Registration.findOne({ transactionId: registrationData.transactionId });
        if (existingTransaction) {
            return res.status(409).json({ status: 'error', message: 'This Transaction ID has already been used.' });
        }

        const newRegistration = new Registration(registrationData);
        await newRegistration.save();

        res.status(201).json({ status: 'success', message: 'Registration successful!' });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
