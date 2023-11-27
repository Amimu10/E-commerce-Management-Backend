const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
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
    const shopCollection = client.db("TechBuddy").collection("shops");
    const productCollection = client.db("TechBuddy").collection("products"); 
    const cartCollection = client.db("TechBuddy").collection("carts"); 

    // jwt related api
    app.post("/jwt", async (req, res) => { 
      const user = req.body; 
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { 
        expiresIn: "1h",  
      });
      res.send({ token }); 
    });

    // middleare
    const verifyToken = (req, res, next) => {
      console.log("inside varify token ", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "forbidden authorization" });
      }
      const token = req.headers.authorization.split(" ")[1]; 
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "forbidden access" });
        }
        req.decoded = decoded; 
        next();
      });
    };

    const verifyAdmin = async (req, res, next) => {   
      const email = req.decoded.email; 
      const query = { email: email}; 
      const user = await userCollection.findOne(query);  
      const isAdmin = user?.role === "admin";  
      if(!isAdmin){
         return res.status(403).send({ message: "forbidden access"});   
      }
      next();    
 }

    const verifyManager = async (req, res, next) => {   
      const email = req.decoded.email; 
      const query = { email: email}; 
      const user = await userCollection.findOne(query);  
      const isManager = user?.role === "manager";  
      if(!isManager){ 
         return res.status(403).send({ message: "forbidden access"});   
      }
      next();    
 }
 
  // user related api
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

     app.get("/users", verifyToken, async (req, res) => { 
        const result = await userCollection.find().toArray();  
        res.send(result);  
      }); 
  
      app.get("/users/admin/:email", verifyToken, async (req, res) => { 
        const email = req.params.email; 
        if(email !== req.decoded.email) { 
           return res.status(403).send({ message: "unauthorized access"}); 
        }
        const query = { email : email}; 
        const user = await userCollection.findOne(query);  
        let admin = false; 
        if(user){
           admin = user?.role === "admin";  
        }
        res.send({admin}); 
    })

      app.get("/users/manager/:email", verifyToken, verifyManager, async (req, res) => { 
        const email = req.params.email; 
        if(email !== req.decoded.email) { 
           return res.status(403).send({ message: "unauthorized access"}); 
        }
        const query = { email : email}; 
        const user = await userCollection.findOne(query);  
        let manager = false; 
        if(user){
           manager = user?.role === "manager";  
        }
        res.send({manager}); 
    })

    app.delete("/users/:id", verifyToken,  async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result); 
    });
    
    
    app.patch("/users/admin/:id", verifyToken, async (req, res) => {
      const id = req.params.id; 
      const filter = { _id: new ObjectId(id) };  
      const updatedDoc = { 
        $set: {
          role: "admin", 
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });


    app.patch("/users/manager/:id", verifyToken, verifyManager, async (req, res) => {
      const id = req.params.id; 
      const filter = { _id: new ObjectId(id) };  
      const updatedDoc = { 
        $set: {
          role: "manager", 
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });



// shop related api
app.post("/shops", async (req, res) => { 
   const shop = req.body;  
   const result = await shopCollection.insertOne(shop);    
   res.send(result);   
})

app.get("/shops", async (req, res) => {
  const result = await shopCollection.find().toArray();
  res.send(result); 
});  

app.get("/shops/:id", async (req, res) => {
    const id = req.params.id; 
    const query = { _id: new ObjectId(id) };
    const result = await shopCollection.findOne(query); 
    res.send(result); 
})


app.post("/products", async (req, res) => { 
   const product = req.body;
   const result = await productCollection.insertOne(product); 
   res.send(result); 
})


app.get("/products", async (req, res) => {
  const result = await productCollection.find().toArray(); 
  res.send(result); 
});  

app.get("/products/:id", verifyToken, async (req, res) => { 
  const id = req.params.id; 
  const query = { _id: new ObjectId(id) };
  const result = await productCollection.findOne(query);  
  res.send(result); 
})

app.patch("/products/:id", async (req, res) => {
  const item = req.body; 
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      product_name: item.product_name, 
      product_price: item.product_price,
      product_image: item.product_image, 
      product_location: item.product_location,
      product_quantity: item.product_quantity,
      product_category: item.product_category,   
      production_cost: item.production_cost, 
      product_added_date: item.product_added_date, 
      profit_margin: item.profit_margin,
      discount: item.discount,
      description: item.description
    }
  }
  const result = await productCollection.updateOne(filter, updatedDoc);
  res.send(result); 
})


app.delete("/products/:id", verifyToken, async (req, res) => {
const id = req.params.id; 
console.log(id);
const query = { _id: new ObjectId(id) };
const result = await productCollection.deleteOne(query); 
console.log(result);
res.send(result); 
})

// cart related api 
app.post("/carts", async (req, res) => {
  const cartItem = req.body; 
  const result = await cartCollection.insertOne(cartItem);
  res.send(result);
});

app.get("/carts", async (req, res) => {
  const email = req.query.email;
  const query = { email: email };
  const result = await cartCollection.find(query).toArray();
  res.send(result);
});

app.delete("/carts/:id", async (req, res) => { 
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await cartCollection.deleteOne(query);
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