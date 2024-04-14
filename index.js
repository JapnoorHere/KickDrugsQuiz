const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const Excel = require('exceljs');
const path = require('path');
const { User, Quiz } = require('./models/quiz');
const session = require('express-session');


const app = express();
const port = 4000;
const mongoose = require('mongoose');

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
// app.use(express.static('images'));


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
})

app.get('/exists', (req, res) => {
    res.render('index');
});

app.post('/details', (req, res) => {
    var { name, email, phone, institution } = req.body;
    const target = new Date().toDateString() + ".xlsx";
    Quiz.findOne({ quiz_name: target }).then((quiz) => {
        if (!quiz) {
            console.log("Quiz not found");
            return res.redirect('/quizNotFound');
        }
        else {

            const usersInQuiz = quiz.user;
            console.log('Users in the quiz:', usersInQuiz);

            usersInQuiz.forEach(user => {
                if (user.email === email) {
                    return res.redirect('/exists');
                }
            });
            console.log("dd", phone);
            app.locals.name = name;
            app.locals.email = email;
            app.locals.phone = phone;
            app.locals.institution = institution;
            res.redirect('/quiz');
        }

    });
});



const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Destination folder for uploaded files

// function checkVisited(req, res, next) {
//     if (req.session.visitedRoutes && req.session.visitedRoutes.includes(req.originalUrl)) {
//         return res.redirect('/');
//     }

//     if (!req.session.visitedRoutes) {
//         req.session.visitedRoutes = [];
//     }

//     req.session.visitedRoutes.push(req.originalUrl);

//     next();
// }

app.get('/quiz', async (req, res) => {

    try {
        const target = new Date().toDateString() + ".xlsx";
        const quiz = await Quiz.findOne({ quiz_name: target }).exec();
        if (quiz) {
            const { quiz_name } = quiz;
            const fileName = quiz_name;
            const bucket = admin.storage().bucket();
            const file = bucket.file(fileName);
            const destination = './uploads/excel-file.xlsx';

            await file.download({ destination });
            console.log('Excel file downloaded successfully.');

            const filePath = './uploads/excel-file.xlsx';
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
        else {
            res.redirect('/quizNotFound');
        }
    }
    catch (err) {
        console.log(err);
    }

})

app.get('/quizNotFound', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "quizNotFound.html"));
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
        const user = new User({ name: app.locals.name, email: app.locals.email, phone: app.locals.phone, score: score, institution: app.locals.institution });
        const target = new Date().toDateString() + ".xlsx";
        await Quiz.findOneAndUpdate({
            quiz_name: target
        }, { $push: { user: user } }, { upsert: true, new: true }
        ).exec();
        app.locals.score = score;
        app.locals.total = questions.length;
        res.redirect('/result');
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }

});

app.get('/result', (req, res) => {
    res.render('result', { score: app.locals.score, total: app.locals.total });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
