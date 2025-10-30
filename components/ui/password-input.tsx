"use client"

import React, { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
}

export function PasswordInput({ 
  label, 
  helperText, 
  className = "", 
  ...props 
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div>
      {label && (
        <label htmlFor={props.id} className="block text-lg font-semibold text-gray-900 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          type={showPassword ? "text" : "password"}
          className={`form-input pr-12 ${className}`}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={0}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
      {helperText && (
        <p className="text-sm text-gray-600 mt-1">{helperText}</p>
      )}
    </div>
  )
}


