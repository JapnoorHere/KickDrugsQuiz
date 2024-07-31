import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
// import axios from 'axios'
const Home = () => {
    const inputClass = 'bg-tan-light py-3 px-2 placeholder-brown-light border border-tan-dark focus:outline-none'
    const navigate = useNavigate();
    const [form,setForm] = useState({});

    const handleInput = (event)=>{
        setForm({...form,
            [event.target.name] : event.target.value
        })
    }

    const submitData = (event)=>{
        event.preventDefault();
        const uniqueID = moment().format('YYYYMMDD'); 
        const navigateTo = `/quiz/${uniqueID}`;
        
        navigate(navigateTo,{state : {form}});
        
    }

    return (
        <>
            <div className='overflow-hidden bg-tan-light min-h-screen w-screen flex justify-center items-center p-4'>
                <form action="" className='border border-tan-dark flex flex-col gap-4 bg-tan-medium w-[400px]  p-6 rounded-lg shadow-lg' onSubmit={submitData}>
                    <h1 className='text-brown-dark text-4xl font-medium'>Register</h1>
                    <p className='mb-4'>Fill your details to continue</p>
                    <input type="text" required placeholder='Name' name='name' value={form.name} className={inputClass} onChange={handleInput}/>
                    <input type="email"  required placeholder='Email' name='email' value={form.email} className={inputClass} onChange={handleInput}/>
                    <input type="tel"  required placeholder='Phone Number' name='phone' value={form.phone} className={inputClass} onChange={handleInput}/>
                    <input type="text"  required placeholder='School/University' name='institution' value={form.institution} className={inputClass} onChange={handleInput}/>
                    <button type='submit' className='self-end text-brown-dark w-fit px-6 py-2 bg-tan-dark hover:opacity-90 rounded-sm border border-transparent hover:border-brown-dark '>Next</button>
                </form>
            </div>
        </>
    )
}

export default Home
