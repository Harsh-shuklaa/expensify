import React from 'react'
import { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6'

const Input = ({ label, type, placeholder, value, onChange, className }) => {
  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  }
  return (
    <div className={`w-full ${className || ""}`}>
      <label className="text-[13px] text-slate-800 dark:text-slate-300">{label}</label>

      <div className='input-box'>
        <input type={type == 'password' ? showPassword ? 'text' : 'password' : type}
          placeholder={placeholder}
          className='w-full bg-transparent outline-none dark:text-gray-100 dark:placeholder-gray-500'
          value={value}
          onChange={(e) => onChange(e)}
        />

        {type === "password" && (
          <>
            {showPassword ? (
              <FaRegEye
                size={22}
                className='text-primary cursor-pointer'
                onClick={() => toggleShowPassword()}
              />
            ) : (
              <FaRegEyeSlash
                size={22}
                className='text-primary cursor-pointer'
                onClick={() => toggleShowPassword()}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Input
