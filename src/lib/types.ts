import { type DateValue } from '@internationalized/date';
import type { MaterialType } from './materials.svelte';

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
  subfamily?: string;
  tags: MaterialTag[];
  /** CAS registry number */
  cas_number?: string;
  links: MaterialLink[];
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

export type MaterialLink = {
  material_id: number;
  value: string;
};

// ============================
// Material (Inventory)
// ============================

export type Material = {
  material_id: number;
  id: number;
  name?: string;
  type?: string;
  manufacturer?: string;
  batch_id?: string;
  link?: string;
  grams_available: number;
  grams_initial: number;
  predilution?: number;
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
  subfamily: string | null;
  cas: string | null;
  linkInput: string;
  links: string[];
  tagInput: string;
  tags: string[];
  reset: () => void;
};

export type MaterialInstanceAdd = {
  /**
   * Use string while adding, parse to int on insert
   */
  materialId: string | null;
  name: string | null;
  manufacturer: string | null;
  batchId: string | null;
  amount: number;
  link: string | null;
  createdAt: DateValue | undefined;
  reset: () => void;
};

export type MaterialTagEdit = {
  value: string;
  color: string;
};

// ============================
// CREATE FORMULA
// ============================

export type FormulaBuilder = {
  name: string;
  description?: string;
  materials: FormulaBuilderMaterial[];
  solventGrams: number;
  targetGrams: number;
  targetConcentration: number;

  reset: () => void;
};

export type FormulaBuilderMaterial = {
  original: Material;
  grams: number;
};
