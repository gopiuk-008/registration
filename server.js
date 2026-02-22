const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from the current directory

// Root route to serve the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

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

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { email, rollNumber } = req.body;

        // Check for duplicate registration
        const existingUser = await Registration.findOne({
            $or: [{ email }, { rollNumber }]
        });

        if (existingUser) {
            const conflictField = existingUser.email === email ? 'Email' : 'Roll Number';
            return res.status(409).json({
                status: 'error',
                message: `${conflictField} is already registered!`
            });
        }

        const registrationData = new Registration(req.body);
        await registrationData.save();
        res.status(201).json({ status: 'success', message: 'Registration successful!' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/api/registrations', async (req, res) => {
    try {
        const registrations = await Registration.find().sort({ registrationDate: -1 });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
