import React from 'react'
import Navbar from './components/Navbar'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Quiz from './pages/Quiz'
import Result from './pages/Result'

const App = () => {
  return (
    <>
      <div className='overflow-hidden'>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" index element={<Home />} />
            <Route path="/quiz/:id" element={<Quiz />} />
            <Route path="/result" element={<Result />} />
          </Routes>
        </BrowserRouter>
      </div>

    </>
  )
}

export default App
