const { axios } = require("axios")
const express = require("express")
const {MongoClient} = require('mongodb')

const app = express()

const url = 'mongodb://localhost:27017/'
const client = new MongoClient(url)
let db

//connection avzec la db mongodb
client.connect().then(()=>{
    db = client.db('emprunt_db')
    console.log('connection avec succes')
})

// les liens des services 

const LIVRES_SERVICES = 'http://localhost:3001'
const MEMBRE_SERVICES = 'http://localhost:3002'

// GET : /emprunts
app.get('/emprunts', async (req, res)=>{
    const emprunts = await db.collection('emprunts').find({}).toArray()
    res.status(200).json(emprunts)
})

// GET : /emprunts/en-cours
app.get('/emprunts/en-cours', async (req, res)=>{
    const emprunts = await db.collection('emprunts').find({retourne : false}).toArray()
    res.status(200).json(emprunts)
})

// GET : /emprunts/:id
app.get('/emprunts/:id', async(req, res)=>{
    const id = req.params.id
    const emprunt = await db.collection('emprunts').find({id}).toArray()
    res.status(200).json(emprunt)
})

// POST : /emprunts
app.post('/emprunts', async (req, res)=>{
    const {idMembre, idLivre, dateEmprunt, dateRetour, retourne} = req.body

    const membre = await axios.get(`${MEMBRE_SERVICES}/${idMembre}`)
    const membreData = membre.data

    const livre = await axios.get(`${LIVRES_SERVICES}/${idLivre}`)
    const livreData = livre.data

    if(livreData.disponible === 'false'){
        res.status(404).json({"message" : "livres indisponible"})
    }
    
    if (membreData.actif === 'false'){
        res.status(404).json({"message" : "livres indisponible"})
    }

    const tous = await db.collection('emprunts').find({}).toArray()
    const newEmprunt = {
        id : tous.length > 0 ? Math.max(...tous.map(e => e.id)) + 1 : 1,
        idMembre,
        idLivre,
        nomMembre : membreData.nom,
        titreLivre : livreData.titre,
        dateEmprunt,
        dateRetour,
        retourne
    }
    const emprunt = await db.collection('emprunts').insertOne(newEmprunt)

    res.status(201).json(emprunt)

})

// PATCH : /emprunts/:id/retour
app.patch('/emprunts/:id/retour', async (req, res)=>{
    const id = req.params.id

    const emprunt = await db.collection('emprunts').find({id}).toArray()
    if(!emprunt){
        res.status(404).json({"message" : " emprunt introuvable !!!"})
    }

    if(emprunt.retourne === 'true'){
        res.status(400).json({"message" : "bad request !!!"})
    }

    emprunt.retourne = 'true'
    emprunt.dateRetour = new Date().toISOString()

    await axios.patch(`${LIVRES_SERVICES}/${emprunt.idLivre}`, {disponible : true})
    
    res.status(200).json(emprunt)

})

// DELETE : /emprunts/:id
app.delete('/emprunts/:id', async (req, res)=>{
    const id = req.params.id
    await db.collection('emprunts').deleteOne({id})
    res.status(200).json({"message" : "suppression avec success !!!"})
})

app.listen("3003", ()=>{
    console.log("le port 3003 est lancé")
})
