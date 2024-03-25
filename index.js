const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const Excel = require('exceljs');
const path = require('path');
const { User, Quiz } = require('./models/quiz');


const app = express();
const port = 4000;
const mongoose = require('mongoose');

var userName = "";
var userEmail = "";
var userPhone = "";

const PORT = 3000;

mongoose.connect("mongodb://localhost:27017/KickDrugsQuiz");
const db = mongoose.connection;

db.on('error', (error) => {
    console.log("DB error : ", error);
})
db.once('open', () => {
    console.log("Connected to database");

});
const admin = require("firebase-admin");

const serviceAccount = require("./kickdrugsquiz-firebase-adminsdk-zf1s8-8b0a1d8a4d.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "kickdrugsquiz.appspot.com"
});



app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('views'));

app.set('view engine', "ejs");
app.set('views', path.join(__dirname, 'views'));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
})

app.post('/details', (req, res) => {
    var { name, email, phone } = req.body;
    console.log("dd", phone);
    app.locals.name = name;
    app.locals.email = email;
    app.locals.phone = phone;
    res.redirect('/quiz');
})


const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Destination folder for uploaded files


app.get('/quiz', async (req, res) => {

    // console.log(readExcelData(path.join(__dirname, "excel.xlsx")));
    try {
        const target = new Date().toDateString() + ".xlsx";
        const quiz = await Quiz.findOne({ quiz_name: target }).exec();
        const fileName = quiz.quiz_name
        const bucket = admin.storage().bucket();
        const file = bucket.file(fileName);
        const destination = './uploads/excel-file.xlsx'; // Local file path to save the downloaded Excel fil

        await file.download({ destination });
        console.log('Excel file downloaded successfully.');

        const filePath = "./uploads/excel-file.xlsx";
        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(1);
        const questions = [];

        worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
            const question = row.getCell(1).value;
            const options = [];
            let correctAnswer;

            for (let i = 2; i <= 5; i++) {
                options.push(row.getCell(i).value);
            }

            correctAnswer = row.getCell(6).value;

            questions.push({ question, options, correctAnswer });
        });

        res.render('quiz', { questions: questions });

    }
    catch (err) {
        console.log(err.message);
    }

})



app.post('/submit', async (req, res) => {
    const { quiz } = req.body;
    try {
        const filePath = "./uploads/excel-file.xlsx";
        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(1);
        const questions = [];

        worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
            const question = row.getCell(1).value;
            const options = [];
            let correctAnswer;

            for (let i = 2; i <= 5; i++) {
                options.push(row.getCell(i).value);
            }

            correctAnswer = row.getCell(6).value;

            questions.push({ question, options, correctAnswer });
        });
        let score = 0;
        if (quiz) {
            for (let i = 0; i < questions.length; i++) {
                if (quiz[i] === questions[i].correctAnswer) {
                    score++;
                }
            }
        }
        console.log(app.locals.phone);
        const user = new User({ name: app.locals.name, email: app.locals.email, phone: app.locals.phone, score: score });
        const target = new Date().toDateString() + ".xlsx";
        await Quiz.findOneAndUpdate({
            quiz_name: target
        }, { $push: { user: user } }, { upsert: true, new: true }
        ).exec();
        res.render('result',{score : score , total : questions.length});
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }



});




app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
