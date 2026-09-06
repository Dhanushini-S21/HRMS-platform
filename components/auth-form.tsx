'use client'

import { FormEvent, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [faceOpen, setFaceOpen] = useState(false)
  const [faceStatus, setFaceStatus] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const cameraRef = useRef<HTMLVideoElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const isSignUp = mode === 'sign-up'

  async function verifyFace() {
    setFaceStatus('Requesting secure camera access…')
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      cameraStreamRef.current = stream
      if (cameraRef.current) cameraRef.current.srcObject = stream
      setCameraReady(true)
      setFaceStatus('Camera ready. Complete biometric matching with your organization’s face provider before production use.')
    } catch {
      setFaceStatus('Camera permission was blocked. Allow camera access in the browser and try again.')
    }
  }

  function closeFace() {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
    cameraStreamRef.current = null
    setCameraReady(false)
    setFaceOpen(false)
  }

  function sendOtp() {
    if (!phone || phone.length < 8) {
      setError('Enter a valid mobile number to receive your verification code.')
      return
    }
    setError('')
    setOtpSent(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSignUp && !otpSent) { sendOtp(); return }
    if (isSignUp && otp.length !== 6) { setError('Enter the 6-digit verification code sent to your phone.'); return }
    setLoading(true)
    setError('')
    try {
      const result = isSignUp
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password })
      if (result.error) {
        const msg = result.error?.message || ''
        if (msg.includes('already') || msg.includes('exists')) {
          setError('An account with this email already exists. Please sign in instead.')
        } else if (msg.includes('Invalid') || msg.includes('invalid')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (msg.includes('not found') || msg.includes('Not found')) {
          setError('No account found with this email. Please sign up first.')
        } else {
          setError(msg || 'We could not complete that request. Please try again.')
        }
        setLoading(false)
        return
      }
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
        setError('Network error — please check your connection and try again.')
      } else {
        setError(msg || 'The authentication service is temporarily unavailable. Please try again.')
      }
      setLoading(false)
    }
  }

  return <form onSubmit={submit} className="space-y-4">
    {isSignUp && <label className="block text-sm font-medium text-[#cfe0f4]">Full name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="Alex Morgan" /></label>}
    {isSignUp && <label className="block text-sm font-medium text-[#cfe0f4]">Mobile number<div className="mt-1.5 flex gap-2"><input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="+91 98765 43210" /><button type="button" onClick={sendOtp} className="shrink-0 rounded-lg border border-primary/30 px-3 text-xs font-semibold text-primary hover:bg-primary/5">{otpSent ? 'Resend OTP' : 'Send OTP'}</button></div></label>}
    {isSignUp && otpSent && <label className="block text-sm font-medium text-[#cfe0f4]">Verification code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} className="mt-1.5 h-11 w-full rounded-lg border border-primary/40 bg-primary/5 px-3 text-sm tracking-[0.35em] outline-none focus:ring-2 focus:ring-primary/15" placeholder="••••••" /><span className="mt-1 block text-xs font-normal text-muted-foreground">Demo verification step ready for SMS provider connection.</span></label>}
    <label className="block text-sm font-medium text-[#cfe0f4]">Work email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="you@company.com" /></label>
    <label className="block text-sm font-medium text-[#cfe0f4]">Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="Minimum 8 characters" /></label>
    {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
    {faceStatus && <p className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">{faceStatus}</p>}
    <button type="button" onClick={() => setFaceOpen(true)} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#23c7b5]/50 bg-[#102944] text-sm font-semibold text-[#48dfca] transition-colors hover:bg-[#173257]">Use face authentication</button>
    <button disabled={loading} className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">{loading ? 'Please wait…' : isSignUp ? (otpSent ? 'Create workspace account' : 'Continue with phone verification') : 'Sign in to HRMS'}</button>
    {faceOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5"><div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">HRMS Security</p><h3 className="mt-1 text-lg font-semibold text-foreground">Face authentication</h3></div><button type="button" onClick={closeFace} className="text-muted-foreground">Close</button></div><div className="relative mt-5 flex h-48 items-center justify-center overflow-hidden rounded-xl border border-primary/30 bg-primary/5">{cameraReady ? <video ref={cameraRef} autoPlay muted playsInline className="h-full w-full object-cover" aria-label="Live camera preview" /> : <div className="rounded-full border-2 border-primary p-8 text-4xl text-primary">◎</div>}</div><p className="mt-4 text-sm leading-6 text-muted-foreground">The browser camera check is active. Actual identity matching and liveness decisions must be performed by a configured biometric provider; HRMS never stores raw camera frames.</p>{faceStatus && <p role="status" className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">{faceStatus}</p>}<button type="button" onClick={verifyFace} className="mt-5 h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground">{cameraReady ? 'Camera check active' : 'Start secure camera check'}</button></div></div>}
  </form>
}
