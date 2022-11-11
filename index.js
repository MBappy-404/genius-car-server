const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();

//middle ware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wss65wz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// console.log(uri);

 function verifyJWT(req, res, next){
     // console.log(req.headers.authorization);
     const authHeader = req.headers.authorization;
     if(!authHeader){
         return  res.status(401).send({message: 'Unauthorize Access'});
     }

     const token = authHeader.split(' ')[1];
     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){

          if(err){
              return res.status(403).send({message: 'Unauthorize Access'})
          }
          req.decoded = decoded;
          next()

     })

 }


async function run() {

     try {

          const serviceCollection = client.db('geniusCar').collection('services');
          const orderCollection = client.db('geniusCar').collection('orders');

          //jwt

          app.post('/jwt', (req, res)=>{
               const user = req.body;
               const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'} );
               res.send({token})
               // console.log(user);
          })
        

          app.get('/services', async (req, res) => {
               const query = {};
               const cursor = serviceCollection.find(query);
               const services = await cursor.toArray();
               res.send(services);
          })

          app.get('/services/:id', async (req, res) => {
               const id = req.params.id;
               const query = { _id: (id) };
               const service = await serviceCollection.findOne(query);
               res.send(service);
               // console.log(service);
          });

          // service

          app.post('/orders',  async (req, res) => {

               const order = req.body;
               const result = await orderCollection.insertOne(order);
               res.send(result)
               // console.log(result);
          })

          //orders api
          app.get('/orders', verifyJWT, async (req, res) => {

               const decoded = req.decoded;
               // console.log(decoded);
               if (decoded.email !== req.query.email) {
                    res.status(403).send({ message: 'unauthorize Forbidden' })

               }
               // console.log(req.headers);
               let query = {};

               if (req.query.email) {
                    query = {
                         email: req.query.email
                    }
               }

               const cursor = orderCollection.find(query);
               const orders = await cursor.toArray();
               res.send(orders)
          })

          //delete 
          app.delete('/orders/:id',  async (req, res) => {
               const id = req.params.id;
               const query = { _id: ObjectId(id) };
               const result = await orderCollection.deleteOne(query)
               res.send(result)
          })

          //update status
          app.patch('/orders/:id',  async (req, res) => {
               const id = req.params.id;
               const status = req.body.status;
               const query = { _id: ObjectId(id) };
               const updateDoc = {
                    $set: {
                         status: status
                    }
               }

               const result = await orderCollection.updateOne(query, updateDoc);

               res.send(result);
               console.log(result);
          })

     }
     finally {

     }

}

run().catch(err => console.log(err));


app.get('/', (req, res) => {
     res.send('genius car server running')
})

app.listen(port, (req, res) => {
     console.log(`genius car server running ${port}`);
})