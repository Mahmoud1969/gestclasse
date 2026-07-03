'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Plus,
  Download,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  UserX,
  FileText,
  Upload,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Toolbar } from '@/components/ui/Toolbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Drawer } from '@/components/ui/Drawer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useStore } from '@/store'
import type { Eleve } from '@/lib/types'
import { moyenneTrimestre, moyenneAnnuelle, progression, computeRanks } from '@/lib/computed'

function safeFormatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return format(d, 'dd/MM/yyyy')
}

interface ParsedEleve {
  nom: string
  prenom: string
  dateNaissance: string
  redoublant: boolean
}

/** Normalize a date cell ("14/03/2009", "2009-03-14", "14-03-2009") → ISO yyyy-mm-dd, or ''. */
function normalizeDate(raw: string): string {
  const s = raw.trim()
  if (!s) return ''
  // yyyy-mm-dd already
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // dd/mm/yyyy or dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (m) {
    const [, d, mo, y] = m
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return ''
}

/**
 * Parse pasted text into students. Accepts one student per line, columns
 * separated by TAB (Excel paste), comma, or semicolon:
 *   Nom [, Prénom [, DateNaissance [, Redoublant]]]
 * "Redoublant" is truthy for: oui, o, yes, y, 1, true, redoublant, x.
 */
function parseImportLines(text: string): ParsedEleve[] {
  const out: ParsedEleve[] = []
  const truthy = new Set(['oui', 'o', 'yes', 'y', '1', 'true', 'redoublant', 'x'])
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const cols = trimmed.split(/\t|,|;/).map((c) => c.trim())
    const nom = cols[0] ?? ''
    const prenom = cols[1] ?? ''
    if (!nom && !prenom) continue
    out.push({
      nom,
      prenom,
      dateNaissance: normalizeDate(cols[2] ?? ''),
      redoublant: truthy.has((cols[3] ?? '').toLowerCase()),
    })
  }
  return out
}

interface EleveRow extends Eleve {
  moyT1: number | null
  moyT2: number | null
  moyT3: number | null
  moyAnnuelle: number | null
  rang: number | null
  progression: 'up' | 'stable' | 'down'
  totalAbsences: number
}

const col = createColumnHelper<EleveRow>()

export default function ElevesPage() {
  const params = useParams()
  const classeId = params.id as string
  const [mounted, setMounted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Eleve | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Eleve | null>(null)
  const [drawerEleve, setDrawerEleve] = useState<EleveRow | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const classes = useStore((s) => s.classes)
  const eleves = useStore((s) => s.eleves)
  const notes = useStore((s) => s.notes)
  const absences = useStore((s) => s.absences)
  const addEleve = useStore((s) => s.addEleve)
  const updateEleve = useStore((s) => s.updateEleve)
  const deleteEleve = useStore((s) => s.deleteEleve)
  const addToast = useStore((s) => s.addToast)

  // Form state — plain React (same pattern as the working class form)
  const [nomInput, setNomInput] = useState('')
  const [prenomInput, setPrenomInput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [redoublantInput, setRedoublantInput] = useState(false)
  const [nomError, setNomError] = useState('')
  const [prenomError, setPrenomError] = useState('')
  const [dateError, setDateError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Import state
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')

  useEffect(() => { setMounted(true) }, [])

  const classe = classes.find((c) => c.id === classeId)
  // IMPORTANT: must be memoized — an inline .filter() creates a new array ref
  // on every render → tableData changes → TanStack Table triggers rerender → infinite loop
  const classEleves = useMemo(
    () => eleves.filter((e) => e.classeId === classeId),
    [eleves, classeId]
  )

  // Reset form when modal opens
  useEffect(() => {
    if (!modalOpen) return
    if (editTarget) {
      setNomInput(editTarget.nom)
      setPrenomInput(editTarget.prenom)
      setDateInput(editTarget.dateNaissance)
      setRedoublantInput(editTarget.redoublant)
    } else {
      setNomInput('')
      setPrenomInput('')
      setDateInput('')
      setRedoublantInput(false)
    }
    setNomError('')
    setPrenomError('')
    setDateError('')
  }, [modalOpen, editTarget])

  function closeModal() {
    setModalOpen(false)
    setNomInput('')
    setPrenomInput('')
    setDateInput('')
    setRedoublantInput(false)
    setNomError('')
    setPrenomError('')
    setDateError('')
  }

  function openCreate() {
    setEditTarget(null)
    setModalOpen(true)
  }

  const openEdit = useCallback((e: Eleve) => {
    setEditTarget(e)
    setModalOpen(true)
  }, [])

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nom = nomInput.trim()
    const prenom = prenomInput.trim()
    const dateNaissance = dateInput.trim()
    let valid = true
    if (!nom) { setNomError('Requis'); valid = false } else setNomError('')
    if (!prenom) { setPrenomError('Requis'); valid = false } else setPrenomError('')
    if (!dateNaissance) { setDateError('Requis'); valid = false } else setDateError('')
    if (!valid) return
    setSubmitting(true)
    if (editTarget) {
      updateEleve(editTarget.id, { nom, prenom, dateNaissance, redoublant: redoublantInput })
      addToast(`${prenom} ${nom} modifié(e)`, 'success')
    } else {
      const maxNum = classEleves.reduce((m, el) => Math.max(m, el.numero), 0)
      addEleve({ nom, prenom, dateNaissance, redoublant: redoublantInput, classeId, numero: maxNum + 1 })
      addToast(`${prenom} ${nom} ajouté(e)`, 'success')
    }
    setSubmitting(false)
    closeModal()
  }

  function handleDelete() {
    if (!deleteTarget) return
    deleteEleve(deleteTarget.id)
    addToast(`Élève supprimé(e)`, 'success')
    setDeleteTarget(null)
  }

  const parsedImport = useMemo(() => parseImportLines(importText), [importText])

  function handleImport() {
    if (parsedImport.length === 0) return
    let num = classEleves.reduce((m, el) => Math.max(m, el.numero), 0)
    parsedImport.forEach((p) => {
      num += 1
      addEleve({
        nom: p.nom,
        prenom: p.prenom,
        dateNaissance: p.dateNaissance,
        redoublant: p.redoublant,
        classeId,
        numero: num,
      })
    })
    addToast(`${parsedImport.length} élève(s) importé(s)`, 'success')
    setImportText('')
    setImportOpen(false)
  }

  function exportCSV() {
    const headers = ['#', 'Nom', 'Prénom', 'Date de Naissance', 'Redoublant', 'Moy. T1', 'Moy. T2', 'Moy. T3', 'Moy. Annuelle']
    const rows = tableData.map((e) => [
      e.numero,
      e.nom,
      e.prenom,
      safeFormatDate(e.dateNaissance),
      e.redoublant ? 'Oui' : 'Non',
      e.moyT1?.toFixed(2) ?? '',
      e.moyT2?.toFixed(2) ?? '',
      e.moyT3?.toFixed(2) ?? '',
      e.moyAnnuelle?.toFixed(2) ?? '',
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${classe?.nom ?? 'classe'}-eleves.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const tableData = useMemo<EleveRow[]>(() => {
    const rows = classEleves.map((eleve) => {
      const t1 = notes.find((n) => n.eleveId === eleve.id && n.trimestre === 1)
      const t2 = notes.find((n) => n.eleveId === eleve.id && n.trimestre === 2)
      const t3 = notes.find((n) => n.eleveId === eleve.id && n.trimestre === 3)
      const moyT1 = t1 ? moyenneTrimestre(t1) : null
      const moyT2 = t2 ? moyenneTrimestre(t2) : null
      const moyT3 = t3 ? moyenneTrimestre(t3) : null
      const moyAnnuelle = moyenneAnnuelle(moyT1, moyT2, moyT3)
      const prog = progression(moyT1, moyT2, moyT3)
      const totalAbsences = absences.filter((a) => a.eleveId === eleve.id).reduce((sum, a) => sum + a.duree, 0)
      return { ...eleve, moyT1, moyT2, moyT3, moyAnnuelle, progression: prog, totalAbsences }
    })
    // Compute class ranking by annual average
    const ranks = computeRanks(rows.map((r) => ({ id: r.id, moyenne: r.moyAnnuelle })))
    return rows.map((r) => ({ ...r, rang: ranks.get(r.id) ?? null }))
  }, [classEleves, notes, absences])

  function MoyCell({ val }: { val: number | null }) {
    if (val === null) return <span className="text-gray-300 font-mono text-[12px]">—</span>
    return (
      <span className={['font-mono text-[12px]', val >= 10 ? 'text-green-700' : 'text-red-700'].join(' ')}>
        {val.toFixed(2)}
      </span>
    )
  }

  const columns = useMemo(() => [
    col.accessor('numero', {
      id: 'numero',
      header: '#',
      size: 44,
      cell: (info) => <span className="text-gray-400 font-mono text-[12px]">{info.getValue()}</span>,
    }),
    col.accessor('nom', {
      header: 'Nom',
      cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>,
    }),
    col.accessor('prenom', {
      header: 'Prénom',
      cell: (info) => <span className="text-gray-700">{info.getValue()}</span>,
    }),
    col.accessor('dateNaissance', {
      header: 'Date de Naissance',
      cell: (info) => (
        <span className="text-gray-600 font-mono text-[12px]">
          {safeFormatDate(info.getValue())}
        </span>
      ),
    }),
    col.accessor('redoublant', {
      header: 'Redoublant',
      size: 100,
      cell: (info) => (
        <Badge variant={info.getValue() ? 'danger' : 'neutral'}>
          {info.getValue() ? 'Oui' : 'Non'}
        </Badge>
      ),
    }),
    col.accessor('totalAbsences', {
      header: 'Absences',
      size: 90,
      cell: (info) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDrawerEleve(info.row.original) }}
          className="font-mono text-[12px] text-gray-600 hover:text-blue-600 transition-colors underline-offset-2 hover:underline"
        >
          {info.getValue()}h
        </button>
      ),
    }),
    col.accessor('moyT1', {
      header: 'Moy. T1',
      size: 80,
      cell: (info) => <MoyCell val={info.getValue()} />,
    }),
    col.accessor('moyT2', {
      header: 'Moy. T2',
      size: 80,
      cell: (info) => <MoyCell val={info.getValue()} />,
    }),
    col.accessor('moyT3', {
      header: 'Moy. T3',
      size: 80,
      cell: (info) => <MoyCell val={info.getValue()} />,
    }),
    col.accessor('moyAnnuelle', {
      header: 'Moy. Annuelle',
      size: 110,
      cell: (info) => {
        const val = info.getValue()
        if (val === null) return <span className="text-gray-300 font-mono text-[12px]">—</span>
        return (
          <span className={['font-mono text-[12px] font-bold', val >= 10 ? 'text-green-700' : 'text-red-700'].join(' ')}>
            {val.toFixed(2)}
          </span>
        )
      },
    }),
    col.accessor('rang', {
      header: 'Rang',
      size: 70,
      cell: (info) => {
        const val = info.getValue()
        if (val === null) return <span className="text-gray-300 font-mono text-[12px]">—</span>
        return (
          <span className={['font-mono text-[12px] font-semibold', val === 1 ? 'text-amber-600' : 'text-gray-700'].join(' ')}>
            {val === 1 ? '🥇 ' : ''}{val}
          </span>
        )
      },
    }),
    col.accessor('progression', {
      header: 'Progression',
      size: 120,
      cell: (info) => {
        const val = info.getValue()
        if (val === 'up') return <Badge variant="success">↑ En progrès</Badge>
        if (val === 'down') return <Badge variant="danger">↓ En baisse</Badge>
        return <Badge variant="info">→ Stable</Badge>
      },
    }),
    col.display({
      id: 'actions',
      header: '',
      size: 104,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Link
            href={`/bulletin/${classeId}/${row.original.id}`}
            onClick={(e) => e.stopPropagation()}
            title="Bulletin de l'élève"
            className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <FileText size={13} />
          </Link>
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row.original) }}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.original) }}
            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    }),
  ], [openEdit, classeId])

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
        title={
          <div className="flex items-center gap-3">
            <Link
              href="/classes"
              className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={14} />
              Retour
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-[14px] font-semibold text-gray-900">
              {classe?.nom ?? '…'}
            </span>
            {classe && (
              <span className="text-[12px] text-gray-500 font-normal">{classe.niveau}</span>
            )}
          </div>
        }
        actions={
          <>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Rechercher…"
                className="h-8 pl-8 pr-3 text-[12px] border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-40"
              />
            </div>
            <Button variant="secondary" size="sm" icon={<Upload size={13} />} onClick={() => setImportOpen(true)}>
              Importer
            </Button>
            <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={exportCSV}>
              Exporter CSV
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={openCreate}>
              Ajouter un élève
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) =>
                hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined, minWidth: header.column.id === 'nom' || header.column.id === 'prenom' ? 100 : undefined }}
                    className={[
                      'px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide select-none whitespace-nowrap',
                      header.column.getCanSort() ? 'cursor-pointer hover:text-gray-800' : '',
                      header.id === 'actions' ? 'text-right pr-4' : '',
                    ].join(' ')}
                  >
                    <div className={['flex items-center gap-1', header.id === 'actions' ? 'justify-end' : ''].join(' ')}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-gray-400">
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
              <TableSkeleton rows={6} cols={13} />
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={13}>
                  <EmptyState
                    icon={<UserX size={22} />}
                    title="Aucun élève"
                    description="Ajoutez des élèves à cette classe pour commencer."
                    action={{ label: '+ Ajouter un élève', onClick: openCreate }}
                  />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setDrawerEleve(row.original)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  style={{ height: 36 }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={['px-3 py-0 whitespace-nowrap', cell.column.id === 'actions' ? 'pr-4' : ''].join(' ')}>
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
        title={editTarget ? 'Modifier l\'élève' : 'Ajouter un élève'}
        footer={
          <>
            <Button variant="secondary" size="sm" type="button" onClick={closeModal}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" type="submit" form="form-eleve" loading={submitting}>
              {editTarget ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </>
        }
      >
        <form id="form-eleve" onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <Input
            label="Nom"
            placeholder="Ex: Ben Ali"
            value={nomInput}
            onChange={(e) => { setNomInput(e.target.value); if (nomError) setNomError('') }}
            error={nomError}
            autoFocus
          />
          <Input
            label="Prénom"
            placeholder="Ex: Youssef"
            value={prenomInput}
            onChange={(e) => { setPrenomInput(e.target.value); if (prenomError) setPrenomError('') }}
            error={prenomError}
          />
          <Input
            label="Date de Naissance"
            type="date"
            value={dateInput}
            onChange={(e) => { setDateInput(e.target.value); if (dateError) setDateError('') }}
            error={dateError}
          />
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-gray-700">Redoublant</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={redoublantInput}
                onChange={(e) => setRedoublantInput(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-[13px] text-gray-700">Oui, cet élève redouble</span>
            </label>
          </div>
        </form>
      </Modal>

      {/* Import modal */}
      <Modal
        open={importOpen}
        onClose={() => { setImportOpen(false); setImportText('') }}
        title="Importer des élèves"
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" type="button" onClick={() => { setImportOpen(false); setImportText('') }}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" type="button" onClick={handleImport} disabled={parsedImport.length === 0}>
              Importer {parsedImport.length > 0 ? `(${parsedImport.length})` : ''}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-[12px] text-gray-600 leading-relaxed">
            Colle une liste d&apos;élèves (une ligne par élève). Tu peux copier-coller
            directement depuis Excel. Colonnes attendues, séparées par une tabulation,
            une virgule ou un point-virgule :
          </p>
          <div className="text-[11px] font-mono bg-gray-50 border border-gray-200 rounded p-2 text-gray-600">
            Nom , Prénom , Date de naissance , Redoublant<br />
            <span className="text-gray-400">Ex : Ben Ali , Youssef , 14/03/2009 , non</span>
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={8}
            placeholder={'Ben Ali\tYoussef\t14/03/2009\tnon\nTrabelsi\tAmira\t22/07/2009\toui'}
            className="w-full text-[12px] font-mono border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {parsedImport.length > 0 && (
            <div className="border border-gray-200 rounded overflow-hidden">
              <div className="bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Aperçu — {parsedImport.length} élève(s)
              </div>
              <div className="max-h-40 overflow-auto">
                <table className="w-full text-[12px]">
                  <tbody>
                    {parsedImport.slice(0, 50).map((p, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        <td className="px-3 py-1 font-medium text-gray-800">{p.nom || <span className="text-red-500">(nom vide)</span>}</td>
                        <td className="px-3 py-1 text-gray-700">{p.prenom || <span className="text-gray-300">—</span>}</td>
                        <td className="px-3 py-1 font-mono text-gray-500">{p.dateNaissance ? safeFormatDate(p.dateNaissance) : '—'}</td>
                        <td className="px-3 py-1">{p.redoublant ? <Badge variant="danger">Redoublant</Badge> : <span className="text-gray-300 text-[11px]">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer l'élève"
        message={`Êtes-vous sûr de vouloir supprimer ${deleteTarget?.prenom} ${deleteTarget?.nom} ? Toutes ses notes et absences seront supprimées.`}
        confirmLabel="Supprimer"
      />

      {/* Student detail drawer */}
      <Drawer
        open={!!drawerEleve}
        onClose={() => setDrawerEleve(null)}
        title={drawerEleve ? `${drawerEleve.prenom} ${drawerEleve.nom}` : ''}
      >
        {drawerEleve && (
          <div className="p-5 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">Informations</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-[12px] text-gray-500">Classe</span>
                  <span className="text-[12px] font-medium text-gray-800">{classe?.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px] text-gray-500">Date de naissance</span>
                  <span className="text-[12px] font-mono text-gray-800">
                    {safeFormatDate(drawerEleve.dateNaissance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px] text-gray-500">Redoublant</span>
                  <Badge variant={drawerEleve.redoublant ? 'danger' : 'neutral'}>
                    {drawerEleve.redoublant ? 'Oui' : 'Non'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">Notes par trimestre</p>
              <div className="grid grid-cols-3 gap-2">
                {(['T1', 'T2', 'T3'] as const).map((t, i) => {
                  const moy = [drawerEleve.moyT1, drawerEleve.moyT2, drawerEleve.moyT3][i]
                  return (
                    <div key={t} className={['border rounded-lg p-3 text-center', moy === null ? 'border-gray-200 bg-gray-50' : moy >= 10 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'].join(' ')}>
                      <p className="text-[11px] text-gray-500 mb-1">{t}</p>
                      <p className={['text-[16px] font-bold font-mono', moy === null ? 'text-gray-300' : moy >= 10 ? 'text-green-700' : 'text-red-700'].join(' ')}>
                        {moy?.toFixed(2) ?? '—'}
                      </p>
                    </div>
                  )
                })}
              </div>
              <div className={['border rounded-lg p-3 flex items-center justify-between', drawerEleve.moyAnnuelle === null ? 'border-gray-200' : drawerEleve.moyAnnuelle >= 10 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'].join(' ')}>
                <span className="text-[12px] font-medium text-gray-600">Moyenne Annuelle</span>
                <span className={['text-[16px] font-bold font-mono', drawerEleve.moyAnnuelle === null ? 'text-gray-300' : drawerEleve.moyAnnuelle >= 10 ? 'text-green-700' : 'text-red-700'].join(' ')}>
                  {drawerEleve.moyAnnuelle?.toFixed(2) ?? '—'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">
                Absences — {drawerEleve.totalAbsences}h total
              </p>
              <AbsenceLog eleveId={drawerEleve.id} classeId={classeId} />
            </div>
          </div>
        )}
      </Drawer>
    </AppShell>
  )
}

function AbsenceLog({ eleveId }: { eleveId: string; classeId: string }) {
  const absences = useStore((s) => s.absences.filter((a) => a.eleveId === eleveId))
  if (absences.length === 0) {
    return <p className="text-[12px] text-gray-400 py-2">Aucune absence enregistrée</p>
  }
  return (
    <table className="w-full text-[12px] border border-gray-200 rounded-lg overflow-hidden">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Date</th>
          <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Durée</th>
          <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Justifiée</th>
          <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">T.</th>
        </tr>
      </thead>
      <tbody>
        {absences.map((a) => (
          <tr key={a.id} className="border-b border-gray-100 last:border-0">
            <td className="px-3 py-1.5 font-mono">{safeFormatDate(a.date)}</td>
            <td className="px-3 py-1.5">{a.duree}h</td>
            <td className="px-3 py-1.5">
              <Badge variant={a.justifiee ? 'success' : 'danger'}>{a.justifiee ? 'Oui' : 'Non'}</Badge>
            </td>
            <td className="px-3 py-1.5 text-gray-600">T{a.trimestre}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
