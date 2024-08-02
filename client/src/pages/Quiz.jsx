import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { BounceLoader } from 'react-spinners';

const Quiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { form } = location.state || {};

  const inputClass = 'bg-tan-light py-3 px-2 placeholder-brown-light border border-tan-dark focus:outline-none';
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_KEY}${location.pathname}`).then((res) => {
      setLoading(false);
      if (res.data === 'quizNotFound') {
        setQuestions({ message: 'notFound' });
        return;
      }
      setQuestions(res.data.questions);
    });
  }, [location.pathname]);

  useEffect(() => {
    if (!form) {
      navigate('/');
    }
  }, [form, navigate]);

  if (!form) {
    return null;
  }

  const handleSelect = (event) => {
    setAnswers({
      ...answers,
      [event.target.name]: event.target.value
    });
  };

  const submitData = (event) => {
    event.preventDefault();

    axios.post(`${process.env.REACT_APP_API_KEY}/quiz`, {
      userData: form,
      quiz: answers
    }).then((res) => {
      if (res.data.message === 'done') {
        let score = res.data.score;
        navigate('/', { replace: true });
        navigate('/result', { state: { result: { score: score, length: questions.length } } }, { replace: true });
      }
    });
  };

  return (
    <>
      {loading ? (
        <div className='overflow-hidden bg-tan-light min-h-screen w-screen flex justify-center items-center p-4'>
          <BounceLoader color="#4a381c" size={105} />
        </div>
      ) : (
        questions.message === 'notFound' ? (
          <div className='overflow-hidden bg-tan-light min-h-screen w-screen flex justify-center items-center p-4'>
            <div className='border border-tan-dark flex flex-col gap-4 bg-tan-medium max-w-full sm:w-[600px] p-6 rounded-lg shadow-lg'>
              <h1 className='text-2xl text-brown-dark text-center'>Quiz Not Found</h1>
            </div>
          </div>
        ) : (
          <div className='overflow-hidden bg-tan-light min-h-screen w-screen flex justify-center items-center p-4'>
            <form
              action=""
              className='border border-tan-dark flex flex-col gap-4 bg-tan-medium max-w-full sm:w-[600px] p-6 rounded-lg shadow-lg'
              onSubmit={submitData}
            >
              <h1 className='text-brown-dark text-3xl sm:text-4xl font-medium'>Quiz</h1>
              <p className='mb-4'>Answer the following questions</p>
              {questions.map((question, index) => (
                <div key={index} className='flex flex-col gap-2 mt-2'>
                  <span className='text-brown-dark'>{index + 1}. {question.question}</span>
                  <select
                    name={question.question}
                    className={inputClass}
                    onChange={handleSelect}
                  >
                    <option>Select an option</option>
                    {question.options.map((option, optionIndex) => (
                      <option key={optionIndex} value={optionIndex}>{option}</option>
                    ))}
                  </select>
                </div>
              ))}
              <button
                type='submit'
                className='self-end text-brown-dark w-fit px-6 py-2 bg-tan-dark hover:opacity-90 rounded-sm border border-transparent hover:border-brown-dark'
              >
                Submit
              </button>
            </form>
          </div>
        )
      )}
    </>
  );
};

export default Quiz;
