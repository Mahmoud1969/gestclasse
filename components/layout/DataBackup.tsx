'use client'

import React, { useRef, useState } from 'react'
import { Download, Upload, Loader2, ShieldCheck } from 'lucide-react'
import { useStore } from '@/store'

/**
 * Data safety card: export the whole app state to a JSON file, or import
 * a previously exported file (replaces everything after confirmation).
 */
export function DataBackup() {
  const refresh = useStore((s) => s.refresh)
  const addToast = useStore((s) => s.addToast)
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'export' | 'import' | null>(null)

  async function handleExport() {
    setBusy('export')
    try {
      const res = await fetch('/api/data', { cache: 'no-store' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `gestclasse-sauvegarde-${stamp}.json`
      a.click()
      URL.revokeObjectURL(url)
      addToast('Sauvegarde téléchargée', 'success')
    } catch {
      addToast('Échec de l’export', 'error')
    } finally {
      setBusy(null)
    }
  }

  function triggerImport() {
    fileRef.current?.click()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return

    const ok = window.confirm(
      'Importer ce fichier remplacera TOUTES les données actuelles (classes, élèves, notes, absences). Continuer ?'
    )
    if (!ok) return

    setBusy('import')
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      // Basic shape guard
      if (
        !Array.isArray(data.classes) ||
        !Array.isArray(data.eleves) ||
        !Array.isArray(data.notes) ||
        !Array.isArray(data.absences)
      ) {
        throw new Error('shape')
      }
      const res = await fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annees: data.annees ?? [{ id: 'annee-default', label: '2024–2025' }],
          anneeActive: data.anneeActive ?? '2024–2025',
          classes: data.classes,
          eleves: data.eleves,
          notes: data.notes,
          absences: data.absences,
        }),
      })
      if (!res.ok) throw new Error()
      await refresh()
      addToast('Données importées', 'success')
    } catch {
      addToast('Fichier invalide ou import échoué', 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="bg-surface border border-line rounded-lg p-5">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={15} className="text-emerald-600" />
        <h3 className="text-[13px] font-semibold text-ink">Sauvegarde des données</h3>
      </div>
      <p className="text-[12px] text-muted mb-4 leading-relaxed">
        Télécharge une copie de sécurité de toutes tes données, ou restaure une
        sauvegarde. Une sauvegarde automatique est aussi conservée dans le cloud.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 h-8 px-3 text-[12px] font-medium bg-surface text-ink border border-line-strong rounded hover:bg-canvas transition-colors disabled:opacity-50"
        >
          {busy === 'export' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          Exporter (JSON)
        </button>
        <button
          type="button"
          onClick={triggerImport}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 h-8 px-3 text-[12px] font-medium bg-surface text-ink border border-line-strong rounded hover:bg-canvas transition-colors disabled:opacity-50"
        >
          {busy === 'import' ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          Importer
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          className="hidden"
        />
      </div>
    </div>
  )
}
