require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// Configuración de CORS
app.use(cors({
    origin: 'http://localhost:3000', // Ajusta esta URL según donde esté corriendo tu front-end
    credentials: true
}));

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema); // Crear un modelo para los usuarios

// Función de registro de usuario
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.status(201).send('User registered successfully');
    } catch (error) {
        res.status(400).send('Error registering user: ' + error.message);
    }
});

// Función de login de usuario
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign(
                {
                    email: user.email,
                    name: user.name,
                    id: user._id
                },
                JWT_SECRET, { expiresIn: '1h' }
            );
            res.status(200).json({ message: 'Login successful', token });
        } else {
            res.status(400).send('Invalid credentials');
        }
    } catch (error) {
        res.status(500).send('Error logging in: ' + error.message);
    }
});
const commentSchema = new mongoose.Schema({
    tittleComment: { type: String, required: true },
    comment: { type: String, required: true },
    date: { type: Date, default: Date.now },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    movieId: { type: Number, required: true },
});

const Comments = mongoose.model('Comment', commentSchema); // Crear un modelo para los comentarios

// Función de agregar comentarios
app.post('/comments', async (req, res) => {
    const { tittleComment, comment, date, userId, name, email, movieId } = req.body;
    try {
        const newComment = new Comments({ tittleComment, comment, date, userId, name, email, movieId });
        await newComment.save();
        res.status(201).json(newComment);
    } catch (error) {
        res.status(400).send('Error adding comment: ' + error.message);
    }
});

// Función de obtener comentarios
app.get('/comments/:movieId', async (req, res) => {
    const { movieId } = req.params;
    try {
        const comments = await Comments.find({ movieId });
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).send('Error fetching comments: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});