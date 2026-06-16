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
    db = client.db('livres_db')
    console.log('mongodb connecté avec succée !')
}).catch(err => console.log(err))

// GET : /livres
app.get('/livres', async(req, res) =>{
    const livres = await db.collection('livres').find({}).toArray()
    res.status(200).json(livres)
})

// GET : /livres/:id
app.get('/livres/:id', async (req, res)=>{
    const id = parseInt(req.params.id)
    const livre = await db.collection('livres').find({id}).toArray()
    if(!livre){
        res.status(404).json({"message" : "livre introuvable"})
    }
    res.status(200).json(livre)
})

// GET : /livres/disponibles
app.get('/livres/disponibles', async (req, res)=>{
    const livres = await db.collection("livres").find({disponible : true}).toArray()
    res.status(200).json(livres)
})

// POST : /livres
app.post('/livres', async (req, res)=>{
    const {titre, auteur, isbn, disponible} = req.body

    const tous = await db.collection('livres').find({}).toArray()

    const newLivre = {
        id : tous.length > 0 ? Math.max(...tous.map(l => l.id)) + 1 : 1,
        titre,
        auteur,
        isbn,
        disponible
    }
    const livre = await db.collection("livres").insertOne(newLivre)
    res.status(201).json(livre)
})

// PUT : /livres/:id
app.put('/livres/:id', async (req, res)=>{
    const id = parseInt(req.params.id)
    const livre = await db.collection('livres').replaceOne({id}, req.body)
    if(!livre){
        res.status(404).json({"message" : "livre introuvable"})
    }
    res.status(200).json(livre)
})

/// PATCH : /livres/:id/disponibilite
app.patch('/livres/:id/disponibilite', async (req, res) => {
    const id = parseInt(req.params.id)
    const { disponible } = req.body

    const livre = await db.collection('livres').updateOne(
        { id: id },                      
        { $set: { disponible: disponible } } 
    )

    res.status(200).json(livre)
})

// DELETE : /livres/:id
app.delete('/livres/:id', async(req, res)=>{
    const id = req.params.id
    const livre = await db.collection("livres").deleteOne({id})
    if(!livre){
        res.status(404).json({"message" : "livre introuvable"})
    }
    res.status(200).json(livre)

})

app.listen('3001', ()=>{
    console.log('port 3001 lancée')
})
