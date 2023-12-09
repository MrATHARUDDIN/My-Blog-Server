const express = require('express')
const app = express()
const { ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser'); 
const port = 5000
app.use(cors({
   origin: ["https://my-blog-7505c.web.app"],
   credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.get('/', (req, res) =>{
    res.send("My Server is runing")
})

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w7mc7t5.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const Procollection = client.db("BlogDB").collection("Blogs");
    const CartCollection = client.db('BlogDB').collection('Cart');
    const CommentCollection = client.db('BlogDB').collection('Comment');
    
    // Auth API
     app.post("/jwt",  async(req, res) => {
      const user = req.body
      console.log(user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res
      .cookie('token', token,{
      httpOnly: true,
      secure:false,
      sameSite:'none'
      }
      )
      .send({sussess : true})
    })
    app.post('/logout' ,async(req , res)=>{
      const user = req.body;
      res.clearCookie('token',{maxAge:0}).send({sussess : true})
    })

    // Blogs
    app.post('/blogs', async (req, res) => {
      const newProduct = req.body;
      const result = await Procollection.insertOne(newProduct);
      res.send(result);
    });
    app.put('/blogs/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const option = {upsert: true };
      const user  = req.body;
      const update = {
        $set: {
          category: user.category,
          date: user.date,
          title: user.title,
          image: user.image,
          short_description: user.short_description,
          long_description: user.long_description,
      }
      }
      const result = await Procollection.updateOne(filter, update , option);
      res.send(result)
    })
    
    app.get('/blog', async (req, res) => {
      const cursor = Procollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    
    app.get('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const optional = {
        projection: {title : 1 , image : 1, short_description :1, long_description :1, category:1, date:1,authname:1,authimg:1,authemail:1,}
      }
      const result = await Procollection.findOne(query , optional);
      res.send(result);
    });
    
    // Cart
    app.post('/wish', async (req, res) => {
      const user = req.body;
      const existingBlog = await CartCollection.findOne({ title: user.title });

  if (existingBlog) {
    return res.status(400).json({ message: 'Blog with the same title already in wishlist' });
  }
      const insertedUser = {
        category: user.category,
        date: user.date,
        title: user.title,
        image: user.image,
        short_description: user.short_description,
        long_description: user.long_description,
        authemail: user.authemail,
        authimg: user.authimg,
        authname: user.authname,
      };
        const result = await CartCollection.insertOne(insertedUser);
      res.send(result);
    });
    
  
    app.get('/wish', async (req, res) => {
      try {
        let query = {};
        if (req.query?.authemail) {
          query = { email: req.query.authemail };
        }
        const cursor = CartCollection.find(query);
        const users = await cursor.toArray();
        res.send(users);
      } catch (error) {
        console.error("Error fetching data from MongoDB:", error);
        res.status(500).send("Internal Server Error");
      }
    });
    app.get('/wishs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const optional = {
        projection: {title : 1 , image : 1, short_description :1, long_description :1, category:1, date:1,authname:1,authimg:1,authemail:1,}
      }
      const result = await CartCollection.findOne(query , optional);
      res.send(result);
    });
    

  
  app.delete('/wish/:id' , async(req , res) => {
    const id = req.params.id;
    console.log(id)
    const query = { _id: new ObjectId(id) };
    const result = await CartCollection.deleteOne(query);
    res.send(result);
  })

  // Comment
  app.post('/comment', async (req, res) => {
    const Comment = req.body;
    const result = await CommentCollection.insertOne(Comment);
    res.send(result);
  });
    app.get('/comments', async (req, res) => {
    const cursor = CommentCollection.find();
    const users = await cursor.toArray();
    res.send(users);
})

    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port , () => {
    console.log(`Port number : ${port}`)
})