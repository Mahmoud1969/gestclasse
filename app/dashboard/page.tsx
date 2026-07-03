'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { Toolbar } from '@/components/ui/Toolbar'
import { Skeleton } from '@/components/ui/Skeleton'
import { DataBackup } from '@/components/layout/DataBackup'
import { useStore } from '@/store'
import { moyenneTrimestre, moyenneAnnuelle } from '@/lib/computed'
import {
  Users,
  BookOpen,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  ClipboardList,
} from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  loading?: boolean
  index?: number
}

function StatCard({ label, value, icon, color, loading, index = 0 }: StatCardProps) {
  return (
    <div
      className="stagger-in group bg-surface border border-line/80 rounded-xl p-5 flex items-start gap-4 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
      style={{ ['--i' as string]: index }}
    >
      <div className={['w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105', color].join(' ')}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10.5px] font-semibold text-faint uppercase tracking-[0.1em] leading-none mb-2.5">
          {label}
        </p>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <p className="text-[26px] font-bold text-ink leading-none tabular-nums">{value}</p>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const allClasses = useStore((s) => s.classes)
  const anneeActive = useStore((s) => s.anneeActive)
  const allEleves = useStore((s) => s.eleves)
  const notes = useStore((s) => s.notes)

  useEffect(() => { setMounted(true) }, [])

  const classes = useMemo(
    () => allClasses.filter((c) => c.annee === anneeActive),
    [allClasses, anneeActive]
  )
  const eleves = useMemo(
    () => allEleves.filter((e) => classes.some((c) => c.id === e.classeId)),
    [allEleves, classes]
  )

  const redoublants = eleves.filter((e) => e.redoublant).length

  const moyenneGenerale = (() => {
    if (!mounted) return null
    const moyennes: number[] = []
    eleves.forEach((eleve) => {
      const t1 = notes.find((n) => n.eleveId === eleve.id && n.trimestre === 1)
      const t2 = notes.find((n) => n.eleveId === eleve.id && n.trimestre === 2)
      const t3 = notes.find((n) => n.eleveId === eleve.id && n.trimestre === 3)
      const m = moyenneAnnuelle(
        t1 ? moyenneTrimestre(t1) : null,
        t2 ? moyenneTrimestre(t2) : null,
        t3 ? moyenneTrimestre(t3) : null
      )
      if (m !== null) moyennes.push(m)
    })
    if (moyennes.length === 0) return null
    return moyennes.reduce((a, b) => a + b, 0) / moyennes.length
  })()

  const statCards = [
    {
      label: 'Total Classes',
      value: mounted ? classes.length : '—',
      icon: <Users size={19} className="text-white" />,
      color: 'bg-gradient-to-br from-blue-500 to-blue-700',
    },
    {
      label: 'Total Élèves',
      value: mounted ? eleves.length : '—',
      icon: <GraduationCap size={19} className="text-white" />,
      color: 'bg-gradient-to-br from-violet-500 to-violet-700',
    },
    {
      label: 'Moyenne Générale',
      value: mounted ? (moyenneGenerale !== null ? moyenneGenerale.toFixed(2) : '—') : '—',
      icon: <TrendingUp size={19} className="text-white" />,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
    },
    {
      label: 'Redoublants',
      value: mounted ? redoublants : '—',
      icon: <AlertCircle size={19} className="text-white" />,
      color: 'bg-gradient-to-br from-gold-400 to-gold-600',
    },
  ]

  return (
    <AppShell>
      <Toolbar title="Tableau de bord" />

      <div className="p-6 flex flex-col gap-6 max-w-5xl">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <StatCard key={card.label} {...card} loading={!mounted} index={i} />
          ))}
        </div>

        {/* Quick access */}
        <div>
          <h2 className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-3">
            Accès rapide
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link href="/classes">
              <div className="flex items-center justify-between p-4 bg-surface border border-line rounded-xl hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200 group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                    <Users size={15} className="text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-ink">Classes</p>
                    <p className="text-[11px] text-muted">
                      {mounted ? `${classes.length} classe${classes.length > 1 ? 's' : ''}` : '—'}
                    </p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-faint group-hover:text-blue-500 transition-colors" />
              </div>
            </Link>

            <Link href="/notes">
              <div className="flex items-center justify-between p-4 bg-surface border border-line rounded-xl hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200 group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                    <BookOpen size={15} className="text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-ink">Notes</p>
                    <p className="text-[11px] text-muted">Feuilles de notes</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-faint group-hover:text-blue-500 transition-colors" />
              </div>
            </Link>

            <Link href="/absences">
              <div className="flex items-center justify-between p-4 bg-surface border border-line rounded-xl hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200 group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                    <ClipboardList size={15} className="text-orange-600 dark:text-orange-300" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-ink">Absences</p>
                    {/* eslint-disable-next-line react/no-unescaped-entities */}
                    <p className="text-[11px] text-muted">Suivi des présences</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-faint group-hover:text-blue-500 transition-colors" />
              </div>
            </Link>
          </div>
        </div>

        {/* Data backup / restore */}
        <DataBackup />

        {/* Classes overview */}
        {mounted && classes.length > 0 && (
          <div>
            <h2 className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-3">
              Vue d&apos;ensemble — Classes
            </h2>
            <div className="bg-surface border border-line rounded-lg overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-canvas">
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted uppercase tracking-wide">Classe</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted uppercase tracking-wide">Niveau</th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted uppercase tracking-wide">Élèves</th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted uppercase tracking-wide">Redoublants</th>
                    <th className="text-right px-4 py-2.5 pr-5 text-[11px] font-semibold text-muted uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => {
                    const classEleves = eleves.filter((e) => e.classeId === cls.id)
                    const classRedoublants = classEleves.filter((e) => e.redoublant).length
                    return (
                      <tr key={cls.id} className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-ink">{cls.nom}</span>
                        </td>
                        <td className="px-4 py-2.5 text-muted">{cls.niveau}</td>
                        <td className="px-4 py-2.5 text-right text-ink">{classEleves.length}</td>
                        <td className="px-4 py-2.5 text-right text-muted">{classRedoublants}</td>
                        <td className="px-4 py-2.5 pr-5 text-right">
                          <Link
                            href={`/classes/${cls.id}/eleves`}
                            className="text-[12px] text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Voir →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
