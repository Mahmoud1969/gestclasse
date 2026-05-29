export interface Annee {
  id: string
  label: string // e.g. "2024–2025"
}

export interface Classe {
  id: string
  nom: string
  niveau: string
  annee: string
}

export interface Eleve {
  id: string
  classeId: string
  numero: number
  nom: string
  prenom: string
  dateNaissance: string
  redoublant: boolean
}

export interface Note {
  id: string
  eleveId: string
  classeId: string
  trimestre: 1 | 2 | 3
  devoir_controle: number | null
  devoir_synthese: number | null
}

export interface Absence {
  id: string
  eleveId: string
  classeId: string
  date: string
  duree: number
  justifiee: boolean
  trimestre: 1 | 2 | 3
}
