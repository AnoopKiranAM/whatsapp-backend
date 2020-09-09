//pwd : 9ipUBcIuIqqnrRzu
//config: "mongodb+srv://admin:9ipUBcIuIqqnrRzu@cluster0.5hwtl.mongodb.net/whatsappdb?retryWrites=true&w=majority"
//mongodb+srv://admin:9ipUBcIuIqqnrRzu@cluster0.5hwtl.mongodb.net/whatsappdb?retryWrites=true&w=majority      

//importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';


//app config
const app = express()
const port = process.env.port || 9000
const pusher = new Pusher({
    appId: '1069072',
    key: '5afaecde9e67c021e7c8',
    secret: 'e4b2ee293db18796621d',
    cluster: 'eu',
    encrypted: true
  });
const db = mongoose.connection

db.once('open',()=>{
    console.log("DB Connected");
    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change",(change) => {
    console.log("A change occuered",change)

    if(change.operationType ==='insert') {
        const messageDetails = change.fullDocument;
        pusher.trigger('messages','inserted',
        {
            name:messageDetails.name,
            message:messageDetails.message,
            timestamp:messageDetails.timestamp,
            received:messageDetails.received
        });
    }else{
        console.log('Error trigerring pusher')
    }    
    })

})

//middleware
app.use(express.json())
//app.use(cors)

//cors headers-->allowing the request to come from anywhere
app.use((req, res, next)=>{
    res.setHeader("Access-control-Allow-Origin", "*");
    res.setHeader("Access-control-Allow-Headers", "*");
    next();
});


//DB config          
const connectionUrl='mongodb+srv://admin:9ipUBcIuIqqnrRzu@cluster0.5hwtl.mongodb.net/whatsappdb?retryWrites=true&w=majority'
mongoose.connect(connectionUrl,{
    userCreateIndex:true,
    usenewUrlParser:true,
    useUnifiedTopology:true
})

//api routes testing the api
app.get('/',(req,res)=>res.status(200).send('hello world'));

//getting all the messages at once
app.get('/messages/sync',(req,res)=>{
    Messages.find((err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})

//posting your message
app.post('/messages/new',(req,res)=>{
    const dbMessage = req.body

    Messages.create(dbMessage, (err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(201).send(data)
        }
    })
})

//listener
app.listen(port,()=>console.log(`Listening on localhost : ${port}`))
