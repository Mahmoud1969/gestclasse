'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { Toolbar } from '@/components/ui/Toolbar'
import { Skeleton } from '@/components/ui/Skeleton'
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
}

function StatCard({ label, value, icon, color, loading }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-start gap-4">
      <div className={['w-10 h-10 rounded-lg flex items-center justify-center shrink-0', color].join(' ')}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide leading-none mb-2">
          {label}
        </p>
        {loading ? (
          <Skeleton className="h-6 w-16" />
        ) : (
          <p className="text-[24px] font-bold text-gray-900 leading-none">{value}</p>
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
      icon: <Users size={18} className="text-blue-600" />,
      color: 'bg-blue-50',
    },
    {
      label: 'Total Élèves',
      value: mounted ? eleves.length : '—',
      icon: <GraduationCap size={18} className="text-violet-600" />,
      color: 'bg-violet-50',
    },
    {
      label: 'Moyenne Générale',
      value: mounted ? (moyenneGenerale !== null ? moyenneGenerale.toFixed(2) : '—') : '—',
      icon: <TrendingUp size={18} className="text-emerald-600" />,
      color: 'bg-emerald-50',
    },
    {
      label: 'Redoublants',
      value: mounted ? redoublants : '—',
      icon: <AlertCircle size={18} className="text-amber-600" />,
      color: 'bg-amber-50',
    },
  ]

  return (
    <AppShell>
      <Toolbar title="Tableau de bord" />

      <div className="p-6 flex flex-col gap-6 max-w-5xl">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} loading={!mounted} />
          ))}
        </div>

        {/* Quick access */}
        <div>
          <h2 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Accès rapide
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link href="/classes">
              <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center">
                    <Users size={15} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-800">Classes</p>
                    <p className="text-[11px] text-gray-500">
                      {mounted ? `${classes.length} classe${classes.length > 1 ? 's' : ''}` : '—'}
                    </p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </Link>

            <Link href="/notes">
              <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-green-100 flex items-center justify-center">
                    <BookOpen size={15} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-800">Notes</p>
                    <p className="text-[11px] text-gray-500">Feuilles de notes</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </Link>

            <Link href="/absences">
              <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-orange-100 flex items-center justify-center">
                    <ClipboardList size={15} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-800">Absences</p>
                    {/* eslint-disable-next-line react/no-unescaped-entities */}
                    <p className="text-[11px] text-gray-500">Suivi des présences</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </Link>
          </div>
        </div>

        {/* Classes overview */}
        {mounted && classes.length > 0 && (
          <div>
            <h2 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Vue d&apos;ensemble — Classes
            </h2>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Classe</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Niveau</th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Élèves</th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Redoublants</th>
                    <th className="text-right px-4 py-2.5 pr-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => {
                    const classEleves = eleves.filter((e) => e.classeId === cls.id)
                    const classRedoublants = classEleves.filter((e) => e.redoublant).length
                    return (
                      <tr key={cls.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-gray-800">{cls.nom}</span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{cls.niveau}</td>
                        <td className="px-4 py-2.5 text-right text-gray-800">{classEleves.length}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{classRedoublants}</td>
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
