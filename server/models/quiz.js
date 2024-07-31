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
  },
  institution : {
    type: String
  }
})

const quizSchema = new mongoose.Schema({
  _id : {
    type : String
  },
  quiz_name: {
    type : String
  },
  user : [userSchema]
});



const User = mongoose.model('User', userSchema);

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = {User,Quiz}


