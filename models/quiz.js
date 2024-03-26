const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name : {
    type : String
  },
  phone : {
    type : String
  },
  email : {
    type : String
  },
  score : {
    type : String
  }
})

const quizSchema = new mongoose.Schema({
  quiz_name: {
    type : String
  },
  user : [userSchema]
});



const User = mongoose.model('User', userSchema);

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = {User,Quiz}


