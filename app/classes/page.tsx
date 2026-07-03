'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, Plus, Search, Users } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Toolbar } from '@/components/ui/Toolbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useStore } from '@/store'
import type { Classe } from '@/lib/types'
import { moyenneTrimestre, moyenneAnnuelle } from '@/lib/computed'

const col = createColumnHelper<Classe & { nbEleves: number; moyenne: number | null }>()

export default function ClassesPage() {
  const [mounted, setMounted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Classe | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Classe | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  // Form state (plain React — keeps things simple and predictable)
  const [nomInput, setNomInput] = useState('')
  const [nomError, setNomError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const allClasses = useStore((s) => s.classes)
  const anneeActive = useStore((s) => s.anneeActive)
  const eleves = useStore((s) => s.eleves)
  const notes = useStore((s) => s.notes)
  const addClass = useStore((s) => s.addClass)
  const updateClass = useStore((s) => s.updateClass)
  const deleteClass = useStore((s) => s.deleteClass)
  const addToast = useStore((s) => s.addToast)
  const router = useRouter()

  // IMPORTANT: must be memoized — an inline .filter() creates a new array ref
  // on every render, which makes tableData change every render, which makes
  // TanStack Table call rerender() every render → infinite loop → browser freeze
  const classes = useMemo(
    () => allClasses.filter((c) => c.annee === anneeActive),
    [allClasses, anneeActive]
  )

  useEffect(() => { setMounted(true) }, [])

  // Reset form state when modal opens
  useEffect(() => {
    if (!modalOpen) return
    setNomInput(editTarget?.nom ?? '')
    setNomError('')
  }, [modalOpen, editTarget])

  function closeModal() {
    setModalOpen(false)
    setNomInput('')
    setNomError('')
  }

  function openCreate() {
    setEditTarget(null)
    setModalOpen(true)
  }

  const openEdit = useCallback((cls: Classe) => {
    setEditTarget(cls)
    setModalOpen(true)
  }, [])

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nom = nomInput.trim()
    if (!nom) {
      setNomError('Requis')
      return
    }
    setSubmitting(true)
    if (editTarget) {
      updateClass(editTarget.id, { nom, niveau: editTarget.niveau, annee: anneeActive })
      addToast(`Classe "${nom}" modifiée`, 'success')
    } else {
      addClass({ nom, niveau: '', annee: anneeActive })
      addToast(`Classe "${nom}" créée`, 'success')
    }
    setSubmitting(false)
    closeModal()
  }

  function handleDelete() {
    if (!deleteTarget) return
    deleteClass(deleteTarget.id)
    addToast(`Classe "${deleteTarget.nom}" supprimée`, 'success')
    setDeleteTarget(null)
  }

  const tableData = useMemo(() => {
    return classes.map((cls) => {
      const classEleves = eleves.filter((e) => e.classeId === cls.id)
      const moyennes: number[] = classEleves.map((eleve) => {
        const t1 = notes.find((n) => n.eleveId === eleve.id && n.trimestre === 1)
        const t2 = notes.find((n) => n.eleveId === eleve.id && n.trimestre === 2)
        const t3 = notes.find((n) => n.eleveId === eleve.id && n.trimestre === 3)
        const m = moyenneAnnuelle(
          t1 ? moyenneTrimestre(t1) : null,
          t2 ? moyenneTrimestre(t2) : null,
          t3 ? moyenneTrimestre(t3) : null
        )
        return m
      }).filter((m): m is number => m !== null)
      const moyenne = moyennes.length > 0 ? moyennes.reduce((a, b) => a + b, 0) / moyennes.length : null
      return { ...cls, nbEleves: classEleves.length, moyenne }
    })
  }, [classes, eleves, notes])

  const columns = useMemo(() => [
    col.accessor((_, i) => i + 1, {
      id: 'index',
      header: '#',
      size: 48,
      enableSorting: false,
      cell: (info) => (
        <span className="text-faint font-mono text-[12px]">{info.getValue()}</span>
      ),
    }),
    col.accessor('nom', {
      header: 'Nom de la Classe',
      cell: (info) => (
        <span className="font-medium text-ink">{info.getValue()}</span>
      ),
    }),
    col.accessor('nbEleves', {
      header: 'Nb Élèves',
      size: 100,
      cell: (info) => <span className="text-ink">{info.getValue()}</span>,
    }),
    col.accessor('moyenne', {
      header: 'Moyenne',
      size: 100,
      cell: (info) => {
        const val = info.getValue()
        if (val === null) return <span className="text-faint font-mono text-[12px]">—</span>
        return (
          <span className={['font-mono text-[12px] font-medium', val >= 10 ? 'text-green-700' : 'text-red-700'].join(' ')}>
            {val.toFixed(2)}
          </span>
        )
      },
    }),
    col.display({
      id: 'actions',
      header: '',
      size: 80,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row.original) }}
            className="p-1.5 rounded hover:bg-surface2 text-faint hover:text-muted transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.original) }}
            className="p-1.5 rounded hover:bg-red-50 text-faint hover:text-red-600 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    }),
  ], [openEdit])

  const table = useReactTable({
    data: tableData,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <AppShell>
      <Toolbar
        title="Classes"
        actions={
          <>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
              <input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Rechercher…"
                className="h-8 pl-8 pr-3 text-[12px] border border-line-strong rounded bg-surface focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-48"
              />
            </div>
            <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={openCreate}>
              Nouvelle Classe
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="bg-canvas border-b border-line sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) =>
                hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    className={[
                      'px-3 py-2 text-left text-[11px] font-semibold text-muted uppercase tracking-wide select-none',
                      header.column.getCanSort() ? 'cursor-pointer hover:text-ink' : '',
                      header.id === 'actions' ? 'text-right pr-4' : '',
                    ].join(' ')}
                  >
                    <div className={['flex items-center gap-1', header.id === 'actions' ? 'justify-end' : ''].join(' ')}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-faint">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp size={12} className="text-blue-500" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown size={12} className="text-blue-500" />
                          ) : (
                            <ChevronsUpDown size={12} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {!mounted ? (
              <TableSkeleton rows={5} cols={5} />
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={<Users size={22} />}
                    title="Aucune classe"
                    description="Créez votre première classe pour commencer à gérer vos élèves."
                    action={{ label: '+ Nouvelle Classe', onClick: openCreate }}
                  />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/classes/${row.original.id}/eleves`)}
                  className="border-b border-line hover:bg-canvas cursor-pointer transition-colors"
                  style={{ height: 36 }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={['px-3 py-0', cell.column.id === 'actions' ? 'pr-4' : ''].join(' ')}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Modifier la classe' : 'Nouvelle Classe'}
        footer={
          <>
            <Button variant="secondary" size="sm" type="button" onClick={closeModal}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" type="submit" form="form-classe" loading={submitting}>
              {editTarget ? 'Enregistrer' : 'Créer'}
            </Button>
          </>
        }
      >
        <form id="form-classe" onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <Input
            label="Nom de la classe"
            placeholder="Ex: 3ème A"
            value={nomInput}
            onChange={(e) => { setNomInput(e.target.value); if (nomError) setNomError('') }}
            error={nomError}
            autoFocus
          />
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer la classe"
        message={`Êtes-vous sûr de vouloir supprimer la classe "${deleteTarget?.nom}" ? Tous les élèves, notes et absences associés seront supprimés.`}
        confirmLabel="Supprimer"
      />
    </AppShell>
  )
}
