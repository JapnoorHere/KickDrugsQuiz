import React, { useEffect } from 'react'
import { useLocation, useNavigate} from 'react-router-dom'

const Result = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {result} = location.state || "";
  useEffect(() => {
    if (!result || result.score === undefined || result.length === undefined) {
      navigate('/');
    }
  }, [result, navigate]);

  if (!result) {
    return null; 
  }

  return (
    <>
      <div className='overflow-hidden bg-tan-light min-h-screen w-screen flex justify-center items-center p-4'>
        <div className='border border-tan-dark flex flex-col gap-4 bg-tan-medium w-[400px]  p-6 rounded-lg shadow-lg'>
          <h1 className='text-center text-2xl text-brown-dark'>You scored : </h1>
          <p className='text-center text-6xl text-tan-dark font-semibold'>{result.score} / {result.length}</p>
          <p className='text-center'>Thank you for attempting this quiz.</p>

        </div>
      </div>
    </>
  )
}

export default Result
