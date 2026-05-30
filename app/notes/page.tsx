'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Printer } from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { AppShell } from '@/components/layout/AppShell'
import { Toolbar } from '@/components/ui/Toolbar'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { NumberInput } from '@/components/ui/NumberInput'
import { NoteInput } from '@/components/ui/NoteInput'
import type { NoteValue } from '@/lib/types'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useStore } from '@/store'
import { moyenneTrimestre, getMention, median, standardDeviation } from '@/lib/computed'
import { BookOpen } from 'lucide-react'

const TRIMESTRE_TABS = [
  { value: '1', label: 'Trimestre 1' },
  { value: '2', label: 'Trimestre 2' },
  { value: '3', label: 'Trimestre 3' },
]

const PIE_COLORS = ['#16a34a', '#dc2626']

function StatValue({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-[12px] text-gray-600">{label}</span>
      <span className={['text-[13px] font-semibold text-gray-900', mono ? 'font-mono' : ''].join(' ')}>{value}</span>
    </div>
  )
}

export default function NotesPage() {
  const [mounted, setMounted] = useState(false)
  const [classeId, setClasseId] = useState('')
  const [trimestre, setTrimestre] = useState('1')

  const allClasses = useStore((s) => s.classes)
  const anneeActive = useStore((s) => s.anneeActive)
  const eleves = useStore((s) => s.eleves)
  const notes = useStore((s) => s.notes)
  const upsertNote = useStore((s) => s.upsertNote)

  const classes = useMemo(
    () => allClasses.filter((c) => c.annee === anneeActive),
    [allClasses, anneeActive]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && classes.length > 0 && !classeId) {
      setClasseId(classes[0].id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, classes.length, classeId])

  // If active year changes and current class is no longer in the list, reset selection
  useEffect(() => {
    if (classeId && !classes.some((c) => c.id === classeId)) {
      setClasseId(classes[0]?.id ?? '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anneeActive])

  const classEleves = useMemo(
    () => eleves.filter((e) => e.classeId === classeId),
    [eleves, classeId]
  )

  const trim = parseInt(trimestre) as 1 | 2 | 3

  const handleNoteChange = useCallback(
    (eleveId: string, field: 'devoir_controle' | 'devoir_synthese', val: NoteValue) => {
      const existing = notes.find((n) => n.eleveId === eleveId && n.trimestre === trim)
      // devoir_synthese only accepts number | null (no AJ), so coerce 'AJ' → null defensively.
      const synthValue: number | null =
        field === 'devoir_synthese'
          ? (typeof val === 'number' ? val : null)
          : (existing?.devoir_synthese ?? null)
      upsertNote({
        id: existing?.id,
        eleveId,
        classeId,
        trimestre: trim,
        devoir_controle: field === 'devoir_controle' ? val : (existing?.devoir_controle ?? null),
        devoir_synthese: synthValue,
      })
    },
    [notes, classeId, trim, upsertNote]
  )

  // Compute moyennes for stats
  const moyennes = useMemo(() => {
    return classEleves
      .map((eleve) => {
        const note = notes.find((n) => n.eleveId === eleve.id && n.trimestre === trim)
        return note ? moyenneTrimestre(note) : null
      })
      .filter((m): m is number => m !== null)
  }, [classEleves, notes, trim])

  const statsData = useMemo(() => {
    if (moyennes.length === 0) return null
    const sum = moyennes.reduce((a, b) => a + b, 0)
    const avg = sum / moyennes.length
    const max = Math.max(...moyennes)
    const min = Math.min(...moyennes)
    const med = median(moyennes) ?? 0
    const std = standardDeviation(moyennes) ?? 0
    const passing = moyennes.filter((m) => m >= 10).length
    const failing = moyennes.filter((m) => m < 10).length
    return { avg, max, min, med, std, passing, failing, total: moyennes.length }
  }, [moyennes])

  const distributionData = useMemo(() => {
    const brackets = [
      { name: '[0–5[', count: 0 },
      { name: '[5–10[', count: 0 },
      { name: '[10–15[', count: 0 },
      { name: '[15–20]', count: 0 },
    ]
    moyennes.forEach((m) => {
      if (m < 5) brackets[0].count++
      else if (m < 10) brackets[1].count++
      else if (m < 15) brackets[2].count++
      else brackets[3].count++
    })
    return brackets
  }, [moyennes])

  const pieData = useMemo(() => {
    if (!statsData) return []
    return [
      { name: 'Réussite', value: statsData.passing },
      { name: 'Échec', value: statsData.failing },
    ]
  }, [statsData])

  // Line chart: evolution across trimesters
  const lineData = useMemo(() => {
    const trimAvgs: { name: string; moyenne: number | null }[] = [1, 2, 3].map((t) => {
      const trimNotes = classEleves.map((eleve) => {
        const note = notes.find((n) => n.eleveId === eleve.id && n.trimestre === t as 1 | 2 | 3)
        return note ? moyenneTrimestre(note) : null
      }).filter((m): m is number => m !== null)
      const avg = trimNotes.length > 0 ? trimNotes.reduce((a, b) => a + b, 0) / trimNotes.length : null
      return { name: `T${t}`, moyenne: avg !== null ? Math.round(avg * 100) / 100 : null }
    })
    const withData = trimAvgs.filter((d) => d.moyenne !== null)
    return withData.length >= 2 ? trimAvgs.map((d) => ({ ...d, moyenne: d.moyenne })) : null
  }, [classEleves, notes])

  const classOptions = classes.map((c) => ({ value: c.id, label: c.nom }))

  return (
    <AppShell>
      <Toolbar
        title={
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-semibold text-gray-900">Notes</span>
            <Select
              options={classOptions}
              value={classeId}
              onChange={setClasseId}
              placeholder="Choisir une classe"
              className="w-36"
            />
          </div>
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<Printer size={13} />}
            onClick={() => window.print()}
            className="no-print"
          >
            Imprimer
          </Button>
        }
      />

      {/* Trimester tabs */}
      <div className="no-print">
        <Tabs
          tabs={TRIMESTRE_TABS}
          active={trimestre}
          onChange={setTrimestre}
          className="px-5"
        />
      </div>

      {!classeId ? (
        <EmptyState
          icon={<BookOpen size={22} />}
          title="Aucune classe sélectionnée"
          description="Sélectionnez une classe pour afficher les notes."
        />
      ) : (
        <div className="flex flex-col">
          {/* Grade table */}
          <div className="overflow-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-10">#</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Nom</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Prénom</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-36">
                    Devoir Contrôle /20
                    <span className="font-normal text-gray-400 ml-1">(coeff 1, A-J possible)</span>
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-36">
                    Devoir Synthèse /20
                    <span className="font-normal text-gray-400 ml-1">(coeff 2)</span>
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-24">Moyenne /20</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-28">Mention</th>
                </tr>
              </thead>
              <tbody>
                {!mounted ? (
                  <TableSkeleton rows={6} cols={7} />
                ) : classEleves.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={<BookOpen size={22} />}
                        title="Aucun élève dans cette classe"
                        description="Ajoutez des élèves dans la section Classes."
                      />
                    </td>
                  </tr>
                ) : (
                  classEleves.map((eleve, i) => {
                    const note = notes.find((n) => n.eleveId === eleve.id && n.trimestre === trim)
                    const moy = note ? moyenneTrimestre(note) : null
                    const mention = getMention(moy)
                    return (
                      <tr key={eleve.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors" style={{ height: 36 }}>
                        <td className="px-3 py-0">
                          <span className="text-gray-400 font-mono text-[12px]">{i + 1}</span>
                        </td>
                        <td className="px-3 py-0 font-medium text-gray-900">{eleve.nom}</td>
                        <td className="px-3 py-0 text-gray-700">{eleve.prenom}</td>
                        <td className="px-1 py-0.5 w-36">
                          <NoteInput
                            value={note?.devoir_controle ?? null}
                            onChange={(val) => handleNoteChange(eleve.id, 'devoir_controle', val)}
                            allowAJ
                          />
                        </td>
                        <td className="px-1 py-0.5 w-36">
                          <NumberInput
                            value={note?.devoir_synthese ?? null}
                            onChange={(val) => handleNoteChange(eleve.id, 'devoir_synthese', val)}
                          />
                        </td>
                        <td className="px-3 py-0 w-24">
                          {moy !== null ? (
                            <span className={['font-mono text-[13px] font-bold', moy >= 10 ? 'text-green-700' : 'text-red-700'].join(' ')}>
                              {moy.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-300 font-mono text-[12px]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-0 w-28">
                          {moy !== null ? (
                            <Badge variant={mention.variant as 'success' | 'info' | 'teal' | 'warning' | 'danger' | 'neutral'}>{mention.label}</Badge>
                          ) : (
                            <span className="text-gray-300 text-[12px]">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Stats panel */}
          {mounted && moyennes.length > 0 && statsData && (
            <div className="p-5 border-t border-gray-200 bg-gray-50/50">
              <h2 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-4 no-print">
                Analyse statistique — Trimestre {trimestre}
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Stat cards */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Statistiques</h3>
                  <StatValue label="Moyenne de la classe" value={statsData.avg.toFixed(2)} mono />
                  <StatValue label="Note la plus haute" value={statsData.max.toFixed(2)} mono />
                  <StatValue label="Note la plus basse" value={statsData.min.toFixed(2)} mono />
                  <StatValue label="Médiane" value={statsData.med.toFixed(2)} mono />
                  <StatValue label="Écart-type (σ)" value={statsData.std.toFixed(2)} mono />
                  <StatValue
                    label="Taux de réussite"
                    value={`${((statsData.passing / statsData.total) * 100).toFixed(1)}% (${statsData.passing} élèves)`}
                  />
                  <StatValue
                    label="Taux d'échec"
                    value={`${((statsData.failing / statsData.total) * 100).toFixed(1)}% (${statsData.failing} élèves)`}
                  />
                  <StatValue label="Élèves ≥10 / <10" value={`${statsData.passing} / ${statsData.failing}`} mono />
                </div>

                {/* Charts */}
                <div className="flex flex-col gap-4 no-print">
                  {/* Bar chart */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Distribution des notes
                    </h3>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={distributionData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                        <RechartTooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }} />
                        <Bar dataKey="count" fill="#2563eb" radius={[3, 3, 0, 0]} name="Élèves" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pie + Line side by side */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Réussite / Échec
                      </h3>
                      <ResponsiveContainer width="100%" height={120}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            dataKey="value"
                          >
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i]} />
                            ))}
                          </Pie>
                          <RechartTooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }} />
                          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {lineData && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Évolution trimestrielle
                        </h3>
                        <ResponsiveContainer width="100%" height={120}>
                          <LineChart data={lineData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                            <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: '#6b7280' }} />
                            <RechartTooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }} />
                            <Line
                              type="monotone"
                              dataKey="moyenne"
                              stroke="#2563eb"
                              strokeWidth={2}
                              dot={{ r: 4, fill: '#2563eb' }}
                              connectNulls={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  )
}
