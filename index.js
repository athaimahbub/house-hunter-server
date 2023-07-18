const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jgqhclb.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const usersCollection = client.db("houseHunterDb").collection("registeredUser");


        // Registration form information collection process
        app.post('/registeredUser', async (req, res) => {
            try {
                const { fullName, role, phoneNumber, email, password } = req.body;

                // Check if user already exists in the database
                const existingUser = await usersCollection.findOne({ email });
                if (existingUser) {
                    return res.status(409).json({ error: 'User with this email already exists' });
                }

                const user = {
                    fullName,
                    role,
                    phoneNumber,
                    email,
                    password,
                };

                // Store the registered user information in the database
                const insertedUser = await usersCollection.insertOne(user);
                user._id = insertedUser.insertedId;

                res.status(201).json({ message: 'User registered successfully', user });
            } catch (error) {
                console.error('Error during registration:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // User Login
        app.post('/login', async (req, res) => {
            try {
              const { email, password } = req.body;
          
              // Check if user exists in the database
              const user = await usersCollection.findOne({ email });
              if (!user) {
                return res.status(401).json({ error: 'Invalid Email address' });
              }
          
              if (user.password !== password) {
                return res.status(401).json({ error: 'Wrong password' });
              }
          
              // Create a JWT token and send it as a response
              const token = jwt.sign({ email: user.email, role: user.role }, process.env.ACCESS_TOKEN_SECRET , {
                expiresIn: '1h', // Token expiration time
              });

              res.send({token});
          
              res.status(200).json({ message: 'Login successful', token });
            } catch (error) {
              console.error('Error during login:', error);
              res.status(500).json({ error: 'Internal server error' });
            }
          });


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



// Basic server Set up Checking
app.get('/', (req, res) => {
    res.send('House Hunter Server is running')
})

app.listen(port, () => {
    console.log(`House Hunter server is running on port ${port}`)
})