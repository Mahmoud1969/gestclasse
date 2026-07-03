'use client'

import React, { useState } from 'react'
import { GraduationCap, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        // Full reload so middleware sees the fresh cookie
        window.location.href = '/dashboard'
        return
      }
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Connexion échouée.')
      setLoading(false)
    } catch {
      setError('Erreur réseau. Réessaie.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-atmosphere px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-4 shadow-elevated ring-1 ring-blue-900/10">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h1 className="text-[26px] font-semibold text-ink tracking-tight font-display">GestClasse</h1>
          <p className="text-[13px] text-muted mt-1">Gestion de classe scolaire</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface/90 backdrop-blur-sm border border-line/80 rounded-2xl shadow-elevated p-7 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[12px] font-medium text-ink">
              Mot de passe
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
              <input
                id="password"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError('') }}
                placeholder="Entre le mot de passe"
                className="w-full h-10 pl-9 pr-3 text-[14px] text-ink bg-surface border border-line-strong rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-[12px] text-red-600">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-11 flex items-center justify-center gap-2 bg-gradient-to-br from-blue-500 to-blue-700 text-white text-[14px] font-medium rounded-xl shadow-sm hover:shadow-md hover:brightness-105 active:brightness-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            Se connecter
          </button>
        </form>

        <p className="text-center text-[11px] text-faint mt-4">
          Accès réservé — entre ton mot de passe enseignant.
        </p>
      </div>
    </div>
  )
}
