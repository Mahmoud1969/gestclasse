'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, ClipboardX } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Drawer } from '@/components/ui/Drawer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useStore } from '@/store'
import type { Eleve } from '@/lib/types'

const absenceSchema = z.object({
  date: z.string().min(1, 'Requis'),
  duree: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0.5 && parseFloat(v) <= 8, { message: 'Entre 0.5 et 8h' }),
  justifiee: z.boolean(),
  trimestre: z.enum(['1', '2', '3']),
})
type AbsenceForm = z.infer<typeof absenceSchema>

function absenceStatut(total: number): { label: string; variant: 'danger' | 'warning' | 'success' } {
  if (total > 10) return { label: 'Critique', variant: 'danger' }
  if (total >= 5) return { label: 'Attention', variant: 'warning' }
  return { label: 'OK', variant: 'success' }
}

interface EleveAbsRow {
  eleve: Eleve
  t1: number
  t2: number
  t3: number
  total: number
}

export default function AbsencesPage() {
  const [mounted, setMounted] = useState(false)
  const [classeId, setClasseId] = useState('')
  const [drawerEleve, setDrawerEleve] = useState<Eleve | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [addingAbsence, setAddingAbsence] = useState(false)

  const allClasses = useStore((s) => s.classes)
  const anneeActive = useStore((s) => s.anneeActive)
  const eleves = useStore((s) => s.eleves)
  const absences = useStore((s) => s.absences)
  const addAbsence = useStore((s) => s.addAbsence)
  const deleteAbsence = useStore((s) => s.deleteAbsence)
  const addToast = useStore((s) => s.addToast)

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AbsenceForm>({
    resolver: zodResolver(absenceSchema),
    defaultValues: { justifiee: false, trimestre: '1' },
    mode: 'onSubmit',
  })

  const classEleves = useMemo(
    () => eleves.filter((e) => e.classeId === classeId),
    [eleves, classeId]
  )

  const tableData = useMemo<EleveAbsRow[]>(() => {
    return classEleves.map((eleve) => {
      const eleveAbs = absences.filter((a) => a.eleveId === eleve.id)
      const t1 = eleveAbs.filter((a) => a.trimestre === 1).reduce((s, a) => s + a.duree, 0)
      const t2 = eleveAbs.filter((a) => a.trimestre === 2).reduce((s, a) => s + a.duree, 0)
      const t3 = eleveAbs.filter((a) => a.trimestre === 3).reduce((s, a) => s + a.duree, 0)
      return { eleve, t1, t2, t3, total: t1 + t2 + t3 }
    })
  }, [classEleves, absences])

  const drawerAbsences = useMemo(
    () => drawerEleve ? absences.filter((a) => a.eleveId === drawerEleve.id) : [],
    [drawerEleve, absences]
  )

  function onAddAbsence(data: AbsenceForm) {
    if (!drawerEleve) return
    addAbsence({
      eleveId: drawerEleve.id,
      classeId,
      date: data.date,
      duree: parseFloat(data.duree),
      justifiee: data.justifiee,
      trimestre: parseInt(data.trimestre) as 1 | 2 | 3,
    })
    addToast('Absence enregistrée', 'success')
    reset()
    setAddingAbsence(false)
  }

  function handleDeleteAbsence() {
    if (!deleteTarget) return
    deleteAbsence(deleteTarget)
    addToast('Absence supprimée', 'success')
    setDeleteTarget(null)
  }

  const classOptions = classes.map((c) => ({ value: c.id, label: c.nom }))

  return (
    <AppShell>
      <Toolbar
        title={
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-semibold text-gray-900">Absences</span>
            <Select
              options={classOptions}
              value={classeId}
              onChange={setClasseId}
              placeholder="Choisir une classe"
              className="w-40"
            />
          </div>
        }
      />

      {!classeId ? (
        <EmptyState
          icon={<ClipboardX size={22} />}
          title="Aucune classe sélectionnée"
          description="Sélectionnez une classe pour voir les absences."
        />
      ) : (
        <div className="overflow-auto flex-1">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-10">#</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Nom</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Prénom</th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Abs. T1 (h)</th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Abs. T2 (h)</th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Abs. T3 (h)</th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
              </tr>
            </thead>
            <tbody>
              {!mounted ? (
                <TableSkeleton rows={6} cols={8} />
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<ClipboardX size={22} />}
                      title="Aucun élève"
                      description="Ajoutez des élèves dans cette classe pour suivre leurs absences."
                    />
                  </td>
                </tr>
              ) : (
                tableData.map((row) => {
                  const statut = absenceStatut(row.total)
                  return (
                    <tr
                      key={row.eleve.id}
                      onClick={() => setDrawerEleve(row.eleve)}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      style={{ height: 36 }}
                    >
                      <td className="px-3 py-0">
                        <span className="text-gray-400 font-mono text-[12px]">{row.eleve.numero}</span>
                      </td>
                      <td className="px-3 py-0 font-medium text-gray-900">{row.eleve.nom}</td>
                      <td className="px-3 py-0 text-gray-700">{row.eleve.prenom}</td>
                      <td className="px-3 py-0 text-center">
                        <span className={['font-mono text-[12px]', row.t1 > 0 ? 'text-gray-800' : 'text-gray-300'].join(' ')}>
                          {row.t1 || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-0 text-center">
                        <span className={['font-mono text-[12px]', row.t2 > 0 ? 'text-gray-800' : 'text-gray-300'].join(' ')}>
                          {row.t2 || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-0 text-center">
                        <span className={['font-mono text-[12px]', row.t3 > 0 ? 'text-gray-800' : 'text-gray-300'].join(' ')}>
                          {row.t3 || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-0 text-center">
                        <span className="font-mono text-[12px] font-semibold text-gray-800">{row.total}h</span>
                      </td>
                      <td className="px-3 py-0">
                        <Badge variant={statut.variant}>{statut.label}</Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Absence drawer */}
      <Drawer
        open={!!drawerEleve}
        onClose={() => { setDrawerEleve(null); setAddingAbsence(false); reset() }}
        title={drawerEleve ? `${drawerEleve.prenom} ${drawerEleve.nom} — Absences` : ''}
      >
        {drawerEleve && (
          <div className="flex flex-col h-full">
            <div className="p-5 flex flex-col gap-4 flex-1 overflow-y-auto">
              {/* Add absence form */}
              {!addingAbsence ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={13} />}
                  onClick={() => setAddingAbsence(true)}
                  className="self-start"
                >
                  Ajouter une absence
                </Button>
              ) : (
                <div className="border border-blue-200 bg-blue-50/40 rounded-lg p-4">
                  <h3 className="text-[12px] font-semibold text-gray-700 mb-3">Nouvelle absence</h3>
                  <form onSubmit={handleSubmit(onAddAbsence)} className="flex flex-col gap-3">
                    <Input
                      label="Date"
                      type="date"
                      error={errors.date?.message}
                      {...register('date')}
                    />
                    <Input
                      label="Durée (heures)"
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="8"
                      placeholder="Ex: 2"
                      error={errors.duree?.message}
                      {...register('duree')}
                    />
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] font-medium text-gray-700">Trimestre</label>
                      <select
                        {...register('trimestre')}
                        className="h-8 w-full px-2.5 text-[13px] text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="1">Trimestre 1</option>
                        <option value="2">Trimestre 2</option>
                        <option value="3">Trimestre 3</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('justifiee')} className="w-4 h-4 accent-blue-600" />
                      <span className="text-[13px] text-gray-700">Absence justifiée</span>
                    </label>
                    <div className="flex gap-2 pt-1">
                      <Button variant="secondary" size="sm" type="button" onClick={() => { setAddingAbsence(false); reset() }}>
                        Annuler
                      </Button>
                      <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
                        Enregistrer
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Absence log */}
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Historique — {drawerAbsences.reduce((s, a) => s + a.duree, 0)}h total
                </p>
                {drawerAbsences.length === 0 ? (
                  <p className="text-[12px] text-gray-400 py-3">Aucune absence enregistrée</p>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Durée</th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Justifiée</th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">T.</th>
                          <th className="px-3 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {drawerAbsences
                          .slice()
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((abs) => (
                            <tr key={abs.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                              <td className="px-3 py-1.5 font-mono">{format(new Date(abs.date), 'dd/MM/yyyy')}</td>
                              <td className="px-3 py-1.5">{abs.duree}h</td>
                              <td className="px-3 py-1.5">
                                <Badge variant={abs.justifiee ? 'success' : 'danger'}>
                                  {abs.justifiee ? 'Oui' : 'Non'}
                                </Badge>
                              </td>
                              <td className="px-3 py-1.5 text-gray-600">T{abs.trimestre}</td>
                              <td className="px-2 py-1.5">
                                <button
                                  onClick={() => setDeleteTarget(abs.id)}
                                  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteAbsence}
        title="Supprimer l'absence"
        message="Êtes-vous sûr de vouloir supprimer cette absence ?"
        confirmLabel="Supprimer"
      />
    </AppShell>
  )
}
