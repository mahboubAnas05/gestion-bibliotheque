const express = require('express')
const { MongoClient } = require('mongodb')

const app = express()

// middleware for working req.body
app.use(express.json())

const url = 'mongodb://localhost:27017/'
const client = new MongoClient(url)
let db

// connection avec la base de donnée
client.connect().then(()=>{
    db = client.db('membres_db')
    console.log('mongodb connecté avec succée !')
}).catch(err => console.log(err))

// GET : /membres
app.get('/membres', async(req, res) =>{
    const membres = await db.collection('membres').find({}).toArray()
    res.status(200).json(membres)
})

// GET : /membres/:id
app.get('/membres/:id', async (req, res)=>{
    const id = parseInt(req.params.id)
    const membre = await db.collection('membres').find({id}).toArray()
    if(!membre){
        res.status(404).json({"message" : "membre introuvable"})
    }
    res.status(200).json(membre)
})

// POST : /membres
app.post('/membres', async (req, res)=>{
    const {nom, email, actif} = req.body

    const tous = await db.collection('membres').find({}).toArray()

    const newMembre = {
        id : tous.length > 0 ? Math.max(...tous.map(l => l.id)) + 1 : 1,
        nom,
        email,
        actif
    }
    const membre = await db.collection("membres").insertOne(newMembre)
    res.status(201).json(membre)
})

// PUT : /membres/:id
app.put('/membres/:id', async (req, res)=>{
    const id = parseInt(req.params.id)
    const membre = await db.collection('membres').replaceOne({id}, req.body)
    if(!membre){
        res.status(404).json({"message" : "membre introuvable"})
    }
    res.status(200).json(membre)
})

/// PATCH : /membres/:id/statut
app.patch('/membres/:id/statut', async (req, res) => {
    const id = parseInt(req.params.id)
    const { actif } = req.body

    const membre = await db.collection('membres').updateOne(
        { id: id },                      
        { $set: { actif: actif } } 
    )

    res.status(200).json(membre)
})

// DELETE : /membres/:id
app.delete('/membres/:id', async(req, res)=>{
    const id = req.params.id
    const membre = await db.collection("membres").deleteOne({id})
    if(!membre){
        res.status(404).json({"message" : "membre introuvable"})
    }
    res.status(200).json(membre)

})

app.listen('3002', ()=>{
    console.log('port 3002 lancée')
})
