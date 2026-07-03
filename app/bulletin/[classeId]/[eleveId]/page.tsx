'use client'

import React, { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { useStore } from '@/store'
import {
  moyenneTrimestre,
  moyenneAnnuelle,
  getMention,
  computeRanks,
} from '@/lib/computed'
import type { Note } from '@/lib/types'

const TRIMS = [1, 2, 3] as const

function fmt(v: number | null): string {
  return v === null ? '—' : v.toFixed(2)
}

function dcLabel(note: Note | undefined): string {
  if (!note) return '—'
  if (note.devoir_controle === 'AJ') return 'A-J'
  if (note.devoir_controle === null) return '—'
  return note.devoir_controle.toFixed(2)
}

export default function BulletinPage() {
  const params = useParams()
  const classeId = params.classeId as string
  const eleveId = params.eleveId as string

  const classes = useStore((s) => s.classes)
  const eleves = useStore((s) => s.eleves)
  const notes = useStore((s) => s.notes)
  const absences = useStore((s) => s.absences)
  const hydrated = useStore((s) => s._hydrated)

  const classe = classes.find((c) => c.id === classeId)
  const eleve = eleves.find((e) => e.id === eleveId)
  const classEleves = useMemo(
    () => eleves.filter((e) => e.classeId === classeId),
    [eleves, classeId]
  )

  // Per-trimester + annual average for this student
  const trimMoys = useMemo(() => {
    return TRIMS.map((t) => {
      const note = notes.find((n) => n.eleveId === eleveId && n.trimestre === t)
      return note ? moyenneTrimestre(note) : null
    })
  }, [notes, eleveId])

  const moyAnnuelle = moyenneAnnuelle(trimMoys[0], trimMoys[1], trimMoys[2])

  // Rank within the class (by annual average)
  const rank = useMemo(() => {
    const entries = classEleves.map((el) => {
      const m = moyenneAnnuelle(
        (() => { const n = notes.find((x) => x.eleveId === el.id && x.trimestre === 1); return n ? moyenneTrimestre(n) : null })(),
        (() => { const n = notes.find((x) => x.eleveId === el.id && x.trimestre === 2); return n ? moyenneTrimestre(n) : null })(),
        (() => { const n = notes.find((x) => x.eleveId === el.id && x.trimestre === 3); return n ? moyenneTrimestre(n) : null })()
      )
      return { id: el.id, moyenne: m }
    })
    return computeRanks(entries).get(eleveId) ?? null
  }, [classEleves, notes, eleveId])

  const totalAbsences = useMemo(
    () => absences.filter((a) => a.eleveId === eleveId).reduce((s, a) => s + a.duree, 0),
    [absences, eleveId]
  )

  const mention = getMention(moyAnnuelle)

  if (hydrated && (!classe || !eleve)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-[14px] text-gray-600">Élève ou classe introuvable.</p>
        <Link href="/classes" className="text-[13px] text-blue-600 hover:underline">← Retour aux classes</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:py-0 print:px-0">
      {/* Action bar (hidden when printing) */}
      <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between no-print">
        <Link
          href={`/classes/${classeId}/eleves`}
          className="inline-flex items-center gap-1.5 text-[13px] text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={14} /> Retour
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 h-9 px-4 text-[13px] font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Printer size={14} /> Imprimer / PDF
        </button>
      </div>

      {/* Bulletin sheet */}
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm p-8 print:border-0 print:shadow-none print:rounded-none print:max-w-none">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-[24px] font-semibold text-gray-900 tracking-tight font-display">Bulletin de notes</h1>
          <p className="text-[13px] text-gray-500 mt-1">Année scolaire {classe?.annee ?? '—'}</p>
        </div>

        {/* Student info */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-[13px]">
          <InfoRow label="Nom & Prénom" value={eleve ? `${eleve.nom} ${eleve.prenom}` : '—'} />
          <InfoRow label="Classe" value={classe?.nom ?? '—'} />
          <InfoRow label="N°" value={eleve ? String(eleve.numero) : '—'} />
          <InfoRow label="Redoublant" value={eleve?.redoublant ? 'Oui' : 'Non'} />
        </div>

        {/* Notes table */}
        <table className="w-full text-[13px] border border-gray-300 border-collapse mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Trimestre</th>
              <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700">Devoir Contrôle</th>
              <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700">Devoir Synthèse</th>
              <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700">Moyenne</th>
            </tr>
          </thead>
          <tbody>
            {TRIMS.map((t, i) => {
              const note = notes.find((n) => n.eleveId === eleveId && n.trimestre === t)
              const moy = trimMoys[i]
              return (
                <tr key={t}>
                  <td className="border border-gray-300 px-3 py-2 font-medium">Trimestre {t}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{dcLabel(note)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-mono">{fmt(note?.devoir_synthese ?? null)}</td>
                  <td className={['border border-gray-300 px-3 py-2 text-center font-mono font-bold', moy === null ? 'text-gray-400' : moy >= 10 ? 'text-green-700' : 'text-red-700'].join(' ')}>
                    {fmt(moy)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <SummaryCard label="Moyenne annuelle" value={fmt(moyAnnuelle)} accent={moyAnnuelle !== null && moyAnnuelle >= 10} />
          <SummaryCard label="Rang" value={rank !== null ? `${rank} / ${classEleves.length}` : '—'} />
          <SummaryCard label="Absences" value={`${totalAbsences}h`} />
        </div>

        {/* Mention */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-[13px]">
          <span className="font-semibold text-gray-700">Mention</span>
          <span className="font-bold text-gray-900">{mention.label}</span>
        </div>

        {/* Signature line */}
        <div className="mt-10 flex justify-end">
          <div className="text-center">
            <div className="w-48 border-t border-gray-400 pt-1 text-[12px] text-gray-500">
              Signature de l&apos;enseignant
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500">{label} :</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={['border rounded-lg p-3 text-center', accent ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'].join(' ')}>
      <p className="text-[11px] text-gray-500 mb-1">{label}</p>
      <p className="text-[16px] font-bold font-mono text-gray-900">{value}</p>
    </div>
  )
}
