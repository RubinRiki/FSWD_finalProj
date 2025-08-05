import React from 'react';
import './Button.css'; // Assuming you have a CSS file for styling


const Button = ({ onClick, children }) => (
  <button className='custom-button' onClick={onClick}>
    {children}
  </button>
);

export default Button;
