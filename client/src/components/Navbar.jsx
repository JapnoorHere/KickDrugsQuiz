import React from 'react'

const Navbar = () => {
  return (
    <nav>
        <div className='gap-4 flex h-[70px] bg-tan-dark items-center px-4'>
            <img src="http://www.kickdrugs.com.au/wp-content/uploads/2018/05/Kickdrugs-2d-gold.png" alt="" className='h-[60px] w-[60px]' />
            <span className='text-brown-dark font-medium text-2xl'>Kick Drugs Australia</span>
        </div>
    </nav>
  )
}

export default Navbar
