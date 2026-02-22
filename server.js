const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Registration Schema
const registrationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    rollNumber: { type: String, required: true },
    college: { type: String, required: true },
    department: { type: String, required: true },
    year: { type: String, required: true },
    events: { type: String, required: true },
    transactionId: { type: String, required: true },
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
            // Check for presence and that string fields are not just empty spaces
            if (!registrationData[field] || (typeof registrationData[field] === 'string' && registrationData[field].trim() === '')) {
                return res.status(400).json({ status: 'error', message: `Field ${field} is required` });
            }
        }

        // Optional: More specific validation for email format
        if (!/\S+@\S+\.\S+/.test(registrationData.email)) {
            return res.status(400).json({ status: 'error', message: 'A valid email is required' });
        }

        // Check for existing registration with the same email
        const existingRegistration = await Registration.findOne({ email: registrationData.email });
        if (existingRegistration) {
            return res.status(409).json({ status: 'error', message: 'This email has already been registered.' });
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
