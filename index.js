require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const Excel = require('exceljs');
const path = require('path');
const { User, Quiz } = require('./models/quiz');
const session = require('express-session');
const https = require('https');
const mongoose = require('mongoose');
const moment = require('moment-timezone');

const { initializeApp } = require("firebase/app");
const { getStorage, ref, getDownloadURL } = require("firebase/storage");

const app = express();
const port = process.env.PORT || 4000;

const firebaseConfig = {
    apiKey: process.env.FB_API_KEY,
    authDomain: process.env.FB_AUTH_DOMAIN,
    projectId: process.env.FB_PROJECT_ID,
    storageBucket: process.env.FB_STORAGE_BUCKET,
    messagingSenderId: process.env.FB_MESSAGING_SENDER_ID,
    appId: process.env.FB_APP_ID,
    measurementId: process.env.FB_MEASUREMENT_ID
};

const firebaseApp = initializeApp(firebaseConfig);

mongoose.connect(process.env.DB_URL);
const db = mongoose.connection;

db.on('error', (error) => {
    console.log("DB error : ", error);
});
db.once('open', () => {
    console.log("Connected to database");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('views'));

app.set('view engine', "ejs");
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true
}));

app.get('/', (req, res) => {
    if (req.session.visitedRoutes) {
        req.session.visitedRoutes = [];
    }
    res.render("index");
});

app.get('/exists', (req, res) => {
    res.render('index');
});

app.post('/details', (req, res) => {
    const { name, email, phone, institution } = req.body;
    req.session.name = name;
    req.session.email = email;
    req.session.phone = phone;
    req.session.institution = institution;
    res.redirect('/quiz');
});

app.get('/quiz', async (req, res) => {
    try {
        const target = new Date().toDateString() + ".xlsx";
        const quiz = await Quiz.findOne({ quiz_name: target }).exec();
        if (quiz) {
            const { quiz_name } = quiz;
            const storage = getStorage(firebaseApp);
            const fileRef = ref(storage, '/' + quiz_name);

            getDownloadURL(fileRef)
                .then((url) => {
                    const file = fs.createWriteStream("./uploads/excel-file.xlsx");
                    https.get(url, function (response) {
                        response.pipe(file);
                        file.on('finish', async () => {
                            file.close();
                            console.log('Excel file downloaded successfully.');
                            const workbook = new Excel.Workbook();
                            await workbook.xlsx.readFile("./uploads/excel-file.xlsx");
                            const worksheet = workbook.getWorksheet(1);
                            const questions = [];
                            worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
                                const question = row.getCell(1).value;
                                const options = [];
                                for (let i = 2; i <= 5; i++) {
                                    options.push(row.getCell(i).value);
                                }
                                const correctAnswer = row.getCell(6).value;
                                questions.push({ question, options, correctAnswer });
                            });
                            res.render('quiz', { questions });
                        });
                    });
                })
                .catch((error) => {
                    console.error(`Failed to download file: ${error}`);
                    res.status(500).send('Internal Server Error');
                });
        } else {
            res.redirect('/quizNotFound');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/quizNotFound', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "quizNotFound.html"));
});

app.post('/submit', async (req, res) => {
    const { quiz } = req.body;
    console.log(quiz);
    try {
        const filePath = "./uploads/excel-file.xlsx";
        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);
        const questions = [];
        worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
            const question = row.getCell(1).value;
            const options = [];
            for (let i = 2; i <= 5; i++) {
                options.push(row.getCell(i).value);
            }
            const correctAnswer = row.getCell(6).value;
            questions.push({ question, options, correctAnswer });
        });

        let score = 0;
        if (quiz) {
            for (let i = 0; i < questions.length; i++) {
                console.log("question = " + questions[i].question + "i = " + parseInt(quiz[i])+1 , " correct = " , questions[i].correctAnswer);
                if (parseInt(quiz[i])+1 === questions[i].correctAnswer) {
                    score++;
                }
            }
        }

        const user = new User({ name: req.session.name, email: req.session.email, phone: req.session.phone, score, institution: req.session.institution });
        const target = moment().tz('Asia/Kolkata').format('ddd MMM DD YYYY') + ".xlsx";
        console.log(target);
        await Quiz.findOneAndUpdate(
            { quiz_name: target },
            { $push: { user } },
            { upsert: true, new: true }
        ).exec();

        req.session.score = score;
        req.session.total = questions.length;
        res.redirect('/result');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/result', (req, res) => {
    res.render('result', { score: req.session.score, total: req.session.total });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
