import React from 'react'
import logo from '../assets/logo.png'
const Navbar = () => {
  return (
    <nav>
        <div className='gap-4 flex h-[70px] bg-tan-dark items-center px-4'>
            <img src={logo} alt="" className='h-[60px] w-[60px]' />
            <span className='text-brown-dark font-medium text-2xl'>Kick Drugs Australia</span>
        </div>
    </nav>
  )
}

export default Navbar
