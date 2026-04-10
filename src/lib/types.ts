import { type DateValue } from '@internationalized/date';
import type {
  MaterialType,
  MaterialInstanceType,
  MaterialTargetType
} from './data/materials.svelte';
import type { FormulaResult } from './data/formulae.svelte';

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
  inventory: Material[];
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
  type: FormulaType;
  name: string;
  description: string | null;
  grams_total: number;
  grams_solvent: number;
  grams_available: number;
  materials: FormulaMaterial[];
  notes: FormulaNote[];
  created_at: string;
  result?: FormulaResult;
};

export type FormulaType = 'MIXTURE' | 'DRAFT';

/**
 * Formula material entry.
 */
export type FormulaMaterial = {
  /**
   * Material/mixture name.
   */
  name: string;

  /**
   * Either the material or formula ID of the entry.
   */
  material_id: number;

  /**
   * Formula ID containing this entry. Only null when inserting.
   */
  formula_id: number | null;

  /**
   * Total amount of mass added, includes material + solvent.
   */
  grams: number;

  /**
   * Amount of material mass added.
   */
  grams_material: number;

  /**
   * Amount of solvent mass added.
   */
  grams_solvent?: number;

  /**
   * Whether the entry is a material or another formula.
   */
  type: FormulaMaterialType;

  /**
   * If the entry is coming from another mixture, this is its ID. Used to group
   * materials by their origin.
   */
  origin: number | null;

  materials?: FormulaMaterial[];
};

export type FormulaMaterialType = 'MATERIAL' | 'MIXTURE';

export type FormulaNote = {
  id: number;
  formula_id: number;
  content: string;
  created_at: string;
};

// ============================
// CREATE MATERIAL
// ============================

export type MaterialAbstractBuilder = {
  name?: string;
  type: MaterialType;
  description?: string;
  family?: string;
  cas?: string;
  linkInput?: string;
  links: string[];
  tagInput?: string;
  tags: string[];
  reset: () => void;
};

export type MaterialInstanceBuilder = {
  name?: string;
  manufacturer?: string;
  batchId?: string;
  grams: number;
  link?: string;
  createdAt: DateValue;
  predilution?: number;
  reset: () => void;
};

export type MaterialDilutionBuilder = {
  material?: Material;
  name?: string;
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
  materials: FormulaBuilderEntry[];
  solvent: number;

  reset: () => void;
};

/**
 * An indirection
 */
export type FormulaBuilderEntry = {
  original?: Material | Formula;
  name: string;
  materialId: number;
  type: FormulaMaterialType;
  grams: number;
};

export type MaterialSpend = {
  original: Material;
  grams: number;
};

export type MaterialRestore = {
  target_type: MaterialTargetType;
  source_id: number;
  source_type: FormulaMaterialType;
  grams: number;
};

export type MaterialHistory = {
  id: number;
  source_id: number;
  source_name: string;
  target_id: number;
  target_name: string;
  target_type: MaterialTargetType;
  grams: number;
  type: FormulaMaterialType;
  created_at: string;
};

export type MixtureSpend = {
  original: Formula;
  grams: number;
};

// ============================
// TRIALS
// ============================

export type Trial = {
  id: number;
  name: string;
  description: string;
  materials: number[];
  notes: TrialNote[];
  created_at: string;
};

export type TrialNote = {
  id: number;
  trial_id: number;
  content: string;
  created_at: string;
};

export type TrialAdd = {
  name?: string;
  description?: string;
  materials: number[];

  reset: () => void;
};
