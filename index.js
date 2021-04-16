const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
require('dotenv').config()
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('doctors'));
app.use(fileUpload());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kdxcg.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const appointmentCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_COLLECTION}`);
    const doctorCollection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_COLLECTION_2}`);

    //--add appointment
    app.post('/addAppointment', (req, res) => {
        const appointment = req.body;
        appointmentCollection.insertOne(appointment)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    //--get appointment list by date
    app.post('/getAppointmentList', (req, res) => {
        const date = req.body;
        const email = req.body.email;
        doctorCollection.find({email:email})
        .toArray((err, doctors)=>{
            const filter={ date: date.formattedDate };
            if (doctors.length === 0) {
                filter.email = email;
            }
            appointmentCollection.find(filter)
            .toArray((err, documents) => {
                res.send(documents);
            })
        }) 
 })

    //--get all patients
    app.get('/getAllPaitients',(req,res)=>{
        appointmentCollection.find({})
        .toArray((err,documents)=>{
            res.send(documents);
        })
    })

    //--get add doctors
    app.get('/getAllDoctors', (req, res)=>{
        doctorCollection.find({})
        .toArray((err, documents)=>{
            res.send(documents);
        })
    })

    //--add doctor , image upload in server file and data save in mongodb
    // app.post('/addDoctor',(req, res)=>{
    //     const file=req.files.file;
    //     const name=req.body.name;
    //     const email=req.body.email;
    //     file.mv(`${__dirname}/doctors/${file.name}`,err=>{
    //         if(err){
    //             console.log(err);
    //             return res.status(500).send({msg: "Failed to image upload"})
    //         }
    //         else{
    //             doctorCollection.insertOne({ name, email, img:file.name })
    //             .then(result => {
    //            res.send(result.insertedCount > 0);
    //         })
    //             // return res.send({name:file.name, path: `${file.name}`})
    //         }
    //     })
    // })

    //--add doctor directly in mongodb
    app.post('/addDoctor', (req, res) => {
        const file=req.files.file;
        const name=req.body.name;
        const email=req.body.email;
        const newImg = file.data;
        const encImg = newImg.toString('base64');
        console.log(name);
        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        doctorCollection.insertOne({ name, email, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    //--is doctor
    app.post('/isDoctor', (req, res) => {
        const email = req.body.email;
        doctorCollection.find({email:email})
        .toArray((err, doctors)=>{
            res.send(doctors.length>0);
        }) 
 })

    console.log("DB Connected");

});

app.get('/', (req, res) => {
    res.send("Hello from doctors portal server!!")
})

app.listen(process.env.PORT || 5000);