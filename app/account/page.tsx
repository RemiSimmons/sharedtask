"use client"

import React, { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import AppHeader from "@/components/app-header"

export default function AccountManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Personal Info State
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({})
  
  // Email Change State
  const [newEmail, setNewEmail] = useState("")
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [emailError, setEmailError] = useState("")
  
  // Messages
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  
  // Email verification state
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [isSendingVerification, setIsSendingVerification] = useState(false)
  
  // Account Actions State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  
  
  // Usage data state
  const [usageData, setUsageData] = useState<any>(null)
  const [isLoadingUsage, setIsLoadingUsage] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/auth/signin')
      return
    }
    
    if (session?.user) {
      setName(session.user.name || "")
      setEmail(session.user.email || "")
      // Fetch email verification status from database
      fetchEmailVerificationStatus()
      // Load usage data
      loadUsageData()
    }
  }, [session, status, router])

  const fetchEmailVerificationStatus = async () => {
    try {
      const response = await fetch('/api/account/verification-status')
      if (response.ok) {
        const data = await response.json()
        setIsEmailVerified(data.isEmailVerified || false)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch email verification status:', error)
      }
    }
  }

  const loadUsageData = async () => {
    try {
      setIsLoadingUsage(true)
      const response = await fetch('/api/account/usage')
      if (response.ok) {
        const data = await response.json()
        setUsageData(data)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load usage data:', error)
      }
    } finally {
      setIsLoadingUsage(false)
    }
  }

  const clearMessages = () => {
    setSuccessMessage("")
    setErrorMessage("")
    setPasswordErrors({})
    setEmailError("")
  }

  // Real-time password validation
  const validatePassword = (password: string) => {
    const errors: string[] = []
    if (password.length < 8) {
      errors.push("Must be at least 8 characters long")
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Must contain at least one lowercase letter")
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Must contain at least one uppercase letter")
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("Must contain at least one number")
    }
    return errors
  }

  const handlePasswordChange = (field: string, value: string) => {
    const newErrors = { ...passwordErrors }
    
    if (field === 'newPassword') {
      setNewPassword(value)
      const errors = validatePassword(value)
      newErrors.newPassword = errors.length > 0 ? errors[0] : ""
      
      // Check if passwords match
      if (confirmPassword && value !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      } else {
        newErrors.confirmPassword = ""
      }
    } else if (field === 'confirmPassword') {
      setConfirmPassword(value)
      if (newPassword && value !== newPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      } else {
        newErrors.confirmPassword = ""
      }
    } else if (field === 'currentPassword') {
      setCurrentPassword(value)
    }
    
    setPasswordErrors(newErrors)
  }

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    
    if (!newEmail) {
      setEmailError("Please enter a new email address")
      return
    }
    
    if (!validateEmail(newEmail)) {
      setEmailError("Please enter a valid email address")
      return
    }
    
    if (newEmail === email) {
      setEmailError("New email must be different from your current email")
      return
    }
    
    setIsChangingEmail(true)
    
    try {
      const response = await fetch('/api/account/change-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'fetch',
        },
        body: JSON.stringify({ 
          newEmail 
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setEmailError(data.error || 'Failed to change email')
        return
      }
      
      setSuccessMessage('Email change request sent! Please check your new email for verification.')
      setNewEmail("")
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Change email error:', error)
      }
      setEmailError('Something went wrong. Please try again.')
    } finally {
      setIsChangingEmail(false)
    }
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    
    if (!name.trim()) {
      setErrorMessage("Name cannot be empty")
      return
    }
    
    setIsUpdatingName(true)
    
    try {
      const response = await fetch('/api/account/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'fetch',
        },
        body: JSON.stringify({ name: name.trim() }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to update name')
        return
      }
      
      setSuccessMessage('Name updated successfully!')
      setIsEditingName(false)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Update name error:', error)
      }
      setErrorMessage('Something went wrong. Please try again.')
    } finally {
      setIsUpdatingName(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    
    // Validate all fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("Please fill in all password fields")
      return
    }
    
    // Check password strength
    const passwordValidationErrors = validatePassword(newPassword)
    if (passwordValidationErrors.length > 0) {
      setErrorMessage(`Password requirements not met: ${passwordValidationErrors[0]}`)
      return
    }
    
    // Check password match
    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match")
      return
    }
    
    // Check if new password is different from current
    if (currentPassword === newPassword) {
      setErrorMessage("New password must be different from your current password")
      return
    }
    
    setIsChangingPassword(true)
    
    try {
      const response = await fetch('/api/account/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'fetch',
        },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword 
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to change password')
        return
      }
      
      setSuccessMessage('Password changed successfully!')
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Change password error:', error)
      }
      setErrorMessage('Something went wrong. Please try again.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDownloadData = async () => {
    clearMessages()
    
    try {
      const response = await fetch('/api/account/export-data')
      
      if (!response.ok) {
        const data = await response.json()
        setErrorMessage(data.error || 'Failed to export data')
        return
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `account-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setSuccessMessage('Data exported successfully!')
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Export data error:', error)
      }
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setErrorMessage('Please type "DELETE" to confirm')
      return
    }
    
    clearMessages()
    setIsDeletingAccount(true)
    
    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'fetch',
        },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to delete account')
        return
      }
      
      // Sign out and redirect
      await signOut({ redirect: false })
      router.push('/')
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete account error:', error)
      }
      setErrorMessage('Something went wrong. Please try again.')
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const handleSendVerificationEmail = async () => {
    clearMessages()
    setIsSendingVerification(true)
    
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to send verification email')
        return
      }
      
      if (data.message === 'Email is already verified') {
        setSuccessMessage('Your email is already verified!')
        setIsEmailVerified(true)
      } else {
        setSuccessMessage('Verification email sent! Please check your inbox and click the verification link.')
        // Refresh verification status after a short delay
        setTimeout(() => {
          fetchEmailVerificationStatus()
        }, 2000)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Send verification error:', error)
      }
      setErrorMessage('Something went wrong. Please try again.')
    } finally {
      setIsSendingVerification(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Header with Back Button */}
      <AppHeader 
        showBackButton={true}
      />

      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 md:space-y-6 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
              <svg className="w-10 h-10 md:w-12 md:h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">Account Management</h1>
            </div>
            <p className="text-base md:text-xl text-gray-700 font-medium px-4">
              Welcome back, {session.user?.name || 'User'}! 👋
            </p>
          </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Main Content - Single Column Layout */}
        <div className="space-y-8">
          
          {/* Personal Information Card */}
          <div className="card-beautiful p-8">
            <div className="flex items-center gap-3 mb-6">
              <svg className="section-icon text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="header-section">Personal Information</h2>
            </div>

            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-2">
                  👤 Full Name
                </label>
                {isEditingName ? (
                  <form onSubmit={handleUpdateName} className="space-y-3">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-input"
                      placeholder="Enter your full name"
                      disabled={isUpdatingName}
                    />
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={isUpdatingName}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        {isUpdatingName ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingName(false)
                          setName(session.user?.name || "")
                        }}
                        className="btn-secondary text-sm px-4 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 text-lg">{name || "Not set"}</span>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-2">
                  📧 Email Address
                </label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 text-lg">{email}</span>
                  </div>
                  
                  <form onSubmit={handleChangeEmail} className="space-y-4">
                    <div>
                      <label htmlFor="new-email" className="block text-sm font-medium text-gray-700 mb-1">
                        New Email Address
                      </label>
                      <input
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className={`form-input ${emailError ? 'border-red-500' : ''}`}
                        placeholder="Enter your new email address"
                        disabled={isChangingEmail}
                      />
                      {emailError && (
                        <p className="text-sm text-red-600 mt-1">{emailError}</p>
                      )}
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isChangingEmail || !newEmail}
                      className={`btn-secondary text-sm py-2 px-4 ${isChangingEmail || !newEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isChangingEmail ? "Sending..." : "📧 Change Email"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Account Date */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-2">
                  📅 Member Since
                </label>
                <span className="text-gray-900 text-lg">
                  {new Date().toLocaleDateString()} {/* This would come from the database */}
                </span>
              </div>

              {/* Email Verification Status */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-2">
                  ✅ Email Verification
                </label>
                <div className="flex items-center gap-3">
                  {isEmailVerified ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Verified ✓
                    </span>
                  ) : (
                    <>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        Pending Verification
                      </span>
                      <button 
                        onClick={handleSendVerificationEmail}
                        disabled={isSendingVerification}
                        className={`text-blue-600 hover:text-blue-800 font-medium text-sm ${isSendingVerification ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isSendingVerification ? 'Sending...' : 'Send Verification Email'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Password Change Card */}
          <div className="card-beautiful p-8">
            <div className="flex items-center gap-3 mb-6">
              <svg className="section-icon text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2-2m0 0a2 2 0 00-2 2m2 2v3a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2M7 7h.01M7 3h5c.512 0 .853.61.853 1.3l.147 3.7s0 .7-.853.7H7s-.853 0-.853-.7l.147-3.7C6.147 3.61 6.488 3 7 3z" />
              </svg>
              <h2 className="header-section">Change Password</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label htmlFor="current-password" className="block text-lg font-semibold text-gray-900 mb-2">
                  🔒 Current Password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  className="form-input"
                  placeholder="Enter your current password"
                  disabled={isChangingPassword}
                />
              </div>

              <div>
                <label htmlFor="new-password" className="block text-lg font-semibold text-gray-900 mb-2">
                  🔑 New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className={`form-input ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                  placeholder="Enter your new password"
                  disabled={isChangingPassword}
                />
                {passwordErrors.newPassword ? (
                  <p className="text-sm text-red-600 mt-1">{passwordErrors.newPassword}</p>
                ) : (
                  <p className="text-sm text-gray-600 mt-1">Must be at least 8 characters with uppercase, lowercase, and number</p>
                )}
              </div>

              <div>
                <label htmlFor="confirm-new-password" className="block text-lg font-semibold text-gray-900 mb-2">
                  🔑 Confirm New Password
                </label>
                <input
                  id="confirm-new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className={`form-input ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Confirm your new password"
                  disabled={isChangingPassword}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className={`w-full btn-primary text-lg py-4 ${isChangingPassword ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isChangingPassword ? "Changing Password..." : "🔄 Change Password"}
              </button>
            </form>
          </div>

          {/* Billing & Usage Card */}
          <div className="card-beautiful p-8">
            <div className="flex items-center gap-3 mb-6">
              <svg className="section-icon text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="header-section">Billing & Usage</h2>
            </div>

            {isLoadingUsage ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 text-sm">Loading usage data...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-2">
                    💳 Current Plan
                  </label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        usageData?.subscription?.accessLevel === 'free' 
                          ? 'bg-gray-100 text-gray-800' 
                          : usageData?.subscription?.accessLevel === 'trial'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {usageData?.subscription?.hasActiveTrial 
                          ? `${usageData.subscription.plan || 'Pro'} Trial` 
                          : usageData?.subscription?.hasActiveSubscription
                          ? `${usageData.subscription.plan || 'Pro'} Plan`
                          : 'Free Plan'
                        }
                      </span>
                      {usageData?.subscription?.hasActiveTrial && usageData?.subscription?.trialDaysRemaining && (
                        <span className="text-sm text-blue-600">
                          {usageData.subscription.trialDaysRemaining} days left
                        </span>
                      )}
                    </div>
                    {usageData?.subscription?.accessLevel === 'free' && (
                      <button 
                        onClick={() => router.push('/pricing')}
                        className="btn-secondary text-sm px-4 py-2"
                      >
                        Upgrade Plan
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-2">
                    📊 Usage Stats
                  </label>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Projects:</span>
                      <span className="font-medium">
                        {usageData?.usage?.projects?.total || 0} total, {usageData?.usage?.projects?.active || 0} active
                        {usageData?.usage?.projects?.max !== -1 && ` / ${usageData.usage.projects.max} max`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Tasks:</span>
                      <span className="font-medium">{usageData?.usage?.tasks?.total || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storage Used:</span>
                      <span className="font-medium">{usageData?.usage?.storage?.used || 0} MB / {usageData?.usage?.storage?.max || 100} MB</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Account Actions Card */}
          <div className="card-beautiful p-8">
            <div className="flex items-center gap-3 mb-6">
              <svg className="section-icon text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h2 className="header-section text-red-600">Account Actions</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📥 Download Your Data</h3>
                <p className="text-gray-600 mb-4">
                  Export all your account data including projects, tasks, and personal information.
                </p>
                <button
                  onClick={handleDownloadData}
                  className="btn-secondary"
                >
                  📦 Download Data
                </button>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-red-600 mb-3">🗑️ Delete Account</h3>
                <p className="text-gray-600 mb-4">
                  Delete everything. This can't be undone.
                </p>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium">
                      Are you sure? This will permanently delete your account and all data.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-red-800 mb-2">
                        Type "DELETE" to confirm:
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="form-input mb-3"
                        placeholder="DELETE"
                        disabled={isDeletingAccount}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
                        className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors ${isDeletingAccount || deleteConfirmText !== 'DELETE' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isDeletingAccount ? "Deleting..." : "Confirm Delete"}
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeleteConfirmText("")
                        }}
                        className="btn-secondary"
                        disabled={isDeletingAccount}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  )
}
