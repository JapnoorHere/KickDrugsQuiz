require('dotenv').config();
const express = require('express');
const fs = require('fs');
const Excel = require('exceljs');
const { User, Quiz } = require('./models/quiz');
const https = require('https');
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const { initializeApp } = require("firebase/app");
const { getStorage, ref, getDownloadURL } = require("firebase/storage");
const cors = require('cors');
const { PassThrough } = require('stream');
const multer = require('multer');


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
app.use(express.json())
app.use(cors({
    origin: '*'
}));

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
                    const passThroughStream = new PassThrough();
                    https.get(url, (response) => {
                        response.pipe(passThroughStream);
                    });

                    passThroughStream.on('finish', async () => {
                        try {
                            const workbook = new Excel.Workbook();
                            await workbook.xlsx.read(passThroughStream);
                            const worksheet = workbook.getWorksheet(1);
                            const questions = [];
                            worksheet.eachRow({ includeEmpty: false }, (row) => {
                                const question = row.getCell(1).value;
                                const options = [];
                                for (let i = 2; i <= 5; i++) {
                                    options.push(row.getCell(i).value);
                                }
                                const correctAnswer = row.getCell(6).value;
                                questions.push({ question, options, correctAnswer });
                            });
                            res.json({ questions });
                        } catch (error) {
                            console.error(`Error reading Excel file: ${error}`);
                            res.status(500).send('Internal Server Error');
                        }
                    });

                    passThroughStream.on('error', (error) => {
                        console.error(`Stream error: ${error}`);
                        res.status(500).send('Internal Server Error');
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
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

app.post('/quiz', upload.single('file'), async (req, res) => {
    const { quiz, userData } = req.body;
    const file = req.file; // This will be available due to multer

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        // Load the Excel file from the in-memory buffer
        const workbook = new Excel.Workbook();
        await workbook.xlsx.load(file.buffer); // Load from buffer
        const worksheet = workbook.getWorksheet(1);
        const questions = [];

        worksheet.eachRow({ includeEmpty: false }, function (row) {
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
                console.log(parseInt(quiz[questions[i].question]) + 1);
                if (parseInt(quiz[questions[i].question]) + 1 === questions[i].correctAnswer) {
                    score++;
                }
            }
        }

        const user = new User({ name: userData.name, email: userData.email, phone: userData.phone, score, institution: userData.institution });
        const target = moment().tz('Asia/Kolkata').format('ddd MMM DD YYYY') + ".xlsx";
        console.log(target);

        await Quiz.findOneAndUpdate(
            { quiz_name: target },
            { $push: { user } },
            { upsert: true, new: true }
        ).exec();

        res.json({ message: 'done', score: score });

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
