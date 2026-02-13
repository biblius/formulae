import { type DateValue } from '@internationalized/date';
import type {
  MaterialType,
  MaterialInstanceType,
  MaterialTargetType
} from './data/materials.svelte';

// ============================
// Materials
// ============================
//
export type MaterialAbstract = {
  id: number;
  name: string;
  description?: string;
  /** Essential oil, synthetic, absolute, etc. */
  type: MaterialType;
  /** TOP | MIDDLE | BASE */
  note?: string;
  /** WOODY | AMBER | FLORAL | FRESH */
  family?: string;
  tags: string[];
  /** CAS registry number */
  cas_number?: string;
  links: string[];
  color?: string;
};

export type MaterialTag = {
  /**
   * materials_abstract ID
   */
  material_id: number;
  value: string;
  /** Optional display color (hex, tailwind token, etc.) */
  color?: string;
};

// ============================
// Material (Inventory)
// ============================

export type Material = {
  material_id: number;
  id: number;
  name?: string;
  type?: MaterialInstanceType;
  manufacturer?: string;
  batch_id?: string;
  link?: string;
  grams_available: number;
  grams_initial: number;
  grams_material?: number;
  grams_solvent?: number;
  created_at: string;
};

// ============================
// Formulae
// ============================

export type Formula = {
  id: number;
  name: string;
  description: string | null;
  grams_total: number;
  materials: FormulaMaterial[];
  notes: FormulaNote[];
  created_at: string;
};

export type FormulaMaterial = {
  material_id: number;
  formula_id: number;
  grams: number;
};

export type FormulaNote = {
  id: number;
  formula_id: number;
  content: string;
  created_at: string;
};

// ============================
// CREATE MATERIAL
// ============================

export type MaterialAbstractAdd = {
  name: string | null;
  type: MaterialType;
  description: string | null;
  family: string | null;
  cas: string | null;
  linkInput: string;
  links: string[];
  tagInput: string;
  tags: string[];
  reset: () => void;
};

export type MaterialAbstractEdit = {
  name: string;
  type: MaterialType;
  tagInput: string;
  tags: string[];
  linkInput: string;
  links: string[];
  family?: string;
  cas?: string;
  description?: string;
};

export type MaterialInstanceAdd = {
  name: string | null;
  manufacturer: string | null;
  batchId: string | null;
  grams: number;
  link: string | null;
  createdAt: DateValue;
  predilution: number | null;
  reset: () => void;
};

export type MaterialDilutionAdd = {
  material: Material | null;
  name: string | null;
  gramsMaterial: number;
  gramsTotal: number;
  createdAt: DateValue;
  reset: () => void;
};

// ============================
// CREATE FORMULA
// ============================

export type FormulaBuilder = {
  name: string;
  description?: string;
  materials: MaterialSpend[];
  solventGrams: number;
  targetGrams: number;
  targetConcentration: number;

  reset: () => void;
};

export type MaterialSpend = {
  original: Material;
  grams: number;
};

export type MaterialHistory = {
  id: number;
  material_id: number;
  target_id: number;
  target_type: MaterialTargetType;
  grams: number;
  created_at: string;
};
