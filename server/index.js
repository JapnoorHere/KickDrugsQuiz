require('dotenv').config();
const express = require('express');
const Excel = require('exceljs');
const https = require('https');
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const { initializeApp } = require("firebase/app");
const { getStorage, ref, getDownloadURL } = require("firebase/storage");
const cors = require('cors');
const { PassThrough } = require('stream');
const { User, Quiz } = require('./models/quiz');

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

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors({
    origin: '*'
}));

// Function to process Excel data
const processExcelFile = async (stream) => {
    const workbook = new Excel.Workbook();
    await workbook.xlsx.read(stream);
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
    return questions;
};

// Get quiz data
app.get('/quiz/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const quiz = await Quiz.findOne({ _id: id }).exec();
        if (quiz) {
            const { quiz_name } = quiz;
            const storage = getStorage(firebaseApp);
            const fileRef = ref(storage, '/' + quiz_name);

            getDownloadURL(fileRef)
                .then((url) => {
                    https.get(url, function (response) {
                        const passthroughStream = new PassThrough();
                        response.pipe(passthroughStream);

                        processExcelFile(passthroughStream).then((questions) => {
                            res.json({ questions });
                        }).catch((error) => {
                            console.error(`Failed to process Excel file: ${error}`);
                            res.status(500).send('Internal Server Error');
                        });
                    });
                })
                .catch((error) => {
                    console.error(`Failed to download file: ${error}`);
                    res.status(500).send('Internal Server Error');
                });
        } else {
            res.json('quizNotFound');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/quiz', async (req, res) => {
    const { quiz, userData } = req.body;
    console.log(quiz, userData);
    try {
        const target = moment().tz('Asia/Kolkata').format('ddd MMM DD YYYY') + ".xlsx";
        const storage = getStorage(firebaseApp);
        const fileRef = ref(storage, '/' + target);

        getDownloadURL(fileRef)
            .then((url) => {
                https.get(url, function (response) {
                    const passthroughStream = new PassThrough();
                    response.pipe(passthroughStream);

                    processExcelFile(passthroughStream).then((questions) => {
                        let score = 0;
                        if (quiz) {
                            for (let i = 0; i < questions.length; i++) {
                                if (parseInt(quiz[questions[i].question]) + 1 === questions[i].correctAnswer) {
                                    score++;
                                }
                            }
                        }

                        const user = new User({
                            name: userData.name,
                            email: userData.email,
                            phone: userData.phone,
                            score,
                            institution: userData.institution
                        });

                        Quiz.findOneAndUpdate(
                            { quiz_name: target },
                            { $push: { user } },
                            { upsert: true, new: true }
                        ).exec().then(() => {
                            res.json({ message: 'done', score: score });
                        }).catch((error) => {
                            console.error(`Failed to save user data: ${error}`);
                            res.status(500).send('Internal Server Error');
                        });

                    }).catch((error) => {
                        console.error(`Failed to process Excel file: ${error}`);
                        res.status(500).send('Internal Server Error');
                    });
                });
            })
            .catch((error) => {
                console.error(`Failed to download file: ${error}`);
                res.status(500).send('Internal Server Error');
            });

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
