const express = require("express");
const app = express();
const cors = require("cors");
// const jwt = require("jsonwebtoken");
require("dotenv").config();
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); 
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// middleawre
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xr3h8at.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
  
    const userCollection = client.db("TechBuddy").collection("users");

     app.post("/users", async (req, res) => { 
       const user = req.body; 
       const query = { email: user.email }; 
       const existingUser = await userCollection.findOne(query); 
       if (existingUser) {
         return res.send({ message: "User already exists", insertedId: null }); 
       } 
       const result = await userCollection.insertOne(user); 
       res.send(result);  
     })


     app.get("/users", async (req, res) => { 
        const result = await userCollection.find().toArray();  
        res.send(result); 
      }); 
  


    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req, res) => {
    res.send("Tech Budddy is sitting");
  });
  
  app.listen(port, () => {
    console.log(`Tech Buddy is sitting on port ${port}`);
  });