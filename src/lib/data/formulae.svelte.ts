import { getLocalTimeZone, now } from '@internationalized/date';
import { db, insertValues } from '../db';
import { materials, restoreMaterials, spendMaterialsFormula } from './materials.svelte';
import type {
  Formula,
  FormulaBuilder,
  FormulaBuilderEntry,
  FormulaMaterial,
  FormulaMaterialType,
  FormulaNote,
  FormulaType,
  Material
} from '../types';
import { date } from '../utils';

export type FormulaState = {
  formulae: Formula[];
  drafts: Formula[];

  get: (id: number) => Formula | undefined;
  getDraft: (id: number) => Formula | undefined;
  swapDraft: (formula: Formula) => void;
};

export let formulae: FormulaState = $state<FormulaState>({
  formulae: [],
  drafts: [],

  get(id: number) {
    return this.formulae.find((f) => f.id === id);
  },

  getDraft(id: number) {
    return this.drafts.find((f) => f.id === id);
  },

  swapDraft(formula: Formula) {
    const i = this.drafts.findIndex((f) => f.id === formula.id);
    if (i !== -1) {
      this.drafts[i] = formula;
    }
  }
});

export type FormulaResult = {
  /**
   * Total amount of materials.
   */
  totalMaterials: number;

  /**
   * Absolute mass of material after dilution, i.e. excluding any solvents.
   */
  materialMass: number;

  /**
   * Percentage material mass of total.
   */
  materialPercent: number;

  /**
   * PPT of material mass of total.
   */
  materialPPT: number;

  /**
   * Absolute mass of solvent including any materials.
   */
  materialSolventMass: number;

  /**
   * Mass of solvent that was added manually, i.e. not coming from materials.
   */
  addedSolventMass: number;

  /**
   * Percentage solvent mass of total.
   */
  solventPercent: number;

  /**
   * PPT of solvent mass of total.
   */
  solventPPT: number;

  /**
   * Absolute mass materials + solvent.
   */
  totalMass: number;

  entries: FormulaEntry[];

  materials: FormulaMaterial[];
};

/**
 * Formula builder entity.
 */
export type FormulaEntry = {
  id: number;

  name: string;

  type: FormulaMaterialType;

  /**
   * Includes solvent if it's a dilution.
   */
  totalMass: number;

  /**
   * Material mass added to total by the entry.
   */
  materialMass: number;

  /**
   * Derived from materialMass
   */
  materialPercent?: number;

  /**
   * Derived from materialPercent
   */
  materialPPT?: number;

  /**
   * Solvent mass added to total by the entry.
   */
  solventMass?: number;

  /**
   * Derived from solventMass
   */
  solventPercent?: number;

  /**
   * Derived from solventPercent
   */
  solventPPT?: number;

  /**
   * Only contains something if the type is `MIXTURE`.
   */
  entries: FormulaEntry[];

  totalMaterials?: number;
};

function toFormulaMaterials(entry: FormulaEntry, origin: number | null = null): FormulaMaterial[] {
  if (entry.type === 'MATERIAL') {
    return [
      {
        name: entry.name,
        material_id: entry.id,
        formula_id: null,
        grams: entry.totalMass,
        grams_material: entry.materialMass,
        grams_solvent: entry.solventMass,
        type: 'MATERIAL',
        origin
      }
    ];
  }

  const material: FormulaMaterial = {
    name: entry.name,
    material_id: entry.id,
    formula_id: null,
    grams: entry.totalMass,
    grams_material: entry.materialMass,
    grams_solvent: entry.solventMass,
    type: 'MIXTURE',
    origin
  };

  const materials = [material];

  for (const e of entry.entries) {
    materials.push(...toFormulaMaterials(e, entry.id));
  }

  return materials;
}

export function toBuilder(formula: Formula): FormulaBuilder {
  const _materials: FormulaBuilderEntry[] = [];

  for (const material of formula.materials) {
    // This means the material is coming from another mixture.
    // The builder expands the mixtures later, only root entries
    // are needed.
    if (material.origin != null) {
      continue;
    }

    const entry: FormulaBuilderEntry = {
      name: material.name,
      materialId: material.material_id,
      grams: material.grams,
      type: material.type
    };

    if (material.type === 'MATERIAL') {
      entry.original = materials.get(material.material_id);
    }

    if (material.type === 'MIXTURE') {
      entry.original = formulae.get(material.material_id);
    }

    _materials.push(entry);
  }

  return {
    name: formula.name,
    description: formula.description ?? undefined,
    materials: _materials,
    solvent: formula.grams_solvent,
    reset() {
      this.name = formula.name;
      this.description = formula.description ?? undefined;
      this.materials = _materials;
      this.solvent = formula.grams_solvent;
    }
  };
}

export function calculateFormulaBuilder(formula: FormulaBuilder): FormulaResult {
  const result: FormulaResult = {
    totalMaterials: 0,
    materialMass: 0,
    materialPercent: 0,
    materialPPT: 0,
    totalMass: formula.solvent,
    materialSolventMass: 0,
    addedSolventMass: formula.solvent,
    solventPercent: 0,
    solventPPT: 0,
    entries: [],
    materials: []
  };

  // Root materials

  for (const { grams, type, original } of formula.materials) {
    if (type === 'MIXTURE') {
      const material = original as Formula;

      const entry = mixInFormula(material, grams);

      result.totalMass += entry.totalMass;
      result.materialMass += entry.materialMass;
      result.materialSolventMass += entry.solventMass ?? 0;

      result.entries.push(entry);

      continue;
    }

    result.totalMass += grams;

    const material = original as Material;

    const gm = material.grams_material;
    const gs = material.grams_solvent;

    if (gm != null && gs != null) {
      const ratio = gm / (gm + gs);

      const materialMass = grams * ratio;
      const solventMass = grams - materialMass;

      result.materialSolventMass += solventMass;

      result.materialMass += materialMass;

      result.entries.push({
        id: material.id,
        name: material.name ?? '',
        materialMass,
        solventMass,
        entries: [],
        type: 'MATERIAL',
        totalMass: grams
      });
    } else {
      result.materialMass += grams;
      result.entries.push({
        id: material.id,
        name: material.name ?? '',
        materialMass: grams,
        entries: [],
        type: 'MATERIAL',
        totalMass: grams
      });
    }
  }

  calculatePercentage(result, result.entries);

  if (result.totalMass > 0) {
    result.solventPercent =
      (result.materialSolventMass + result.addedSolventMass) / result.totalMass;
    result.solventPPT = parseInt((result.solventPercent * 1000).toFixed(0));
    result.materialPercent = result.materialMass / result.totalMass;
    result.materialPPT = parseInt((result.materialPercent * 1000).toFixed(0));
  }

  for (const e of result.entries) {
    result.materials.push(...toFormulaMaterials(e));
  }

  const unique = new Set();
  for (const material of result.materials) {
    if (unique.has(material.material_id) || material.type === 'MIXTURE') {
      continue;
    }
    unique.add(material.material_id);
  }

  result.totalMaterials = unique.size;

  return result;
}

function mixInFormula(formula: Formula, amount: number): FormulaEntry {
  console.log('Mixing in ', formula.name);
  const entry: FormulaEntry = {
    id: formula.id,
    name: formula.name,
    materialMass: 0,
    entries: [],
    type: 'MIXTURE',
    totalMass: amount,
    solventMass: (formula.grams_solvent / formula.grams_total) * amount,
    totalMaterials: 0
  };

  for (const material of formula.materials) {
    // Skip materials coming from other formulae, they get handled by recursion
    if (material.origin != null) {
      continue;
    }

    if (material.type === 'MIXTURE') {
      const formulaParent = formulae.get(material.material_id)!;

      const child = mixInFormula(formulaParent, (material.grams / formula.grams_total) * amount);

      entry.materialMass += child.materialMass;
      entry.solventMass! += child.solventMass ?? 0;
      entry.totalMaterials! += child.totalMaterials!;

      entry.entries.push(child);
      continue;
    }

    entry.totalMaterials! += 1;

    const materialParent = materials.get(material.material_id);
    if (materialParent == null) {
      continue;
    }

    const gm = materialParent.grams_material;
    const gs = materialParent.grams_solvent;

    if (gm != null && gs != null) {
      const ratio = gm / (gm + gs);

      const materialGrams = (material.grams / formula.grams_total) * ratio;
      const solventGrams = material.grams / formula.grams_total - materialGrams / material.grams;

      const materialAmount = materialGrams * amount;
      const solventAmount = solventGrams * amount;

      entry.materialMass += materialAmount;
      entry.solventMass! += solventAmount;

      entry.entries.push({
        id: materialParent.id,
        name: materialParent.name ?? '',
        materialMass: materialAmount,
        totalMass: materialAmount + solventAmount,
        solventMass: solventAmount,
        entries: [],
        type: 'MATERIAL'
      });
    } else {
      const materialAmount = (material.grams / formula.grams_total) * amount;

      entry.materialMass += materialAmount;

      entry.entries.push({
        id: materialParent.id,
        type: 'MATERIAL',
        name: materialParent.name ?? '',
        materialMass: materialAmount,
        totalMass: materialAmount,
        entries: []
      });
    }
  }

  return entry;
}

function calculatePercentage(result: FormulaResult, entries: FormulaEntry[]) {
  for (const entry of entries) {
    if (entry.type === 'MIXTURE') {
      calculatePercentage(result, entry.entries);
      entry.materialPercent = entry.entries.reduce((acc, e) => acc + e.materialPercent!!, 0);
      entry.materialPPT = parseInt((entry.materialPercent * 1000).toFixed(0));
    } else {
      if (result.totalMass === 0) {
        entry.materialPercent = 0;
        entry.materialPPT = 0;
        continue;
      }
      entry.materialPercent = entry.materialMass / result.totalMass;
      entry.materialPPT = parseInt((entry.materialPercent * 1000).toFixed(0));
    }
  }
}

export async function initFormulae() {
  const f = await listFormulae();
  for (const formula of f) {
    if (formula.type === 'DRAFT') {
      formulae.drafts.push(formula);
    } else if (formula.type === 'MIXTURE') {
      formulae.formulae.push(formula);
    }
  }
}

export async function insertFormulaDraft(state: FormulaBuilder): Promise<Formula> {
  const _db = await db();

  const result = calculateFormulaBuilder(state);

  const grams_total = result.totalMass;

  const { lastInsertId: formulaId } = await _db.execute(
    `
      INSERT INTO formulae(
        name,
        type,
        description,
        grams_total,
        grams_solvent
      ) 
      VALUES($1, $2, $3, $4, $5)
      `,
    [state.name, 'DRAFT', state.description, grams_total, state.solvent]
  );

  await insertValues(
    'formula_materials',
    [
      'name',
      'material_id',
      'formula_id',
      'grams',
      'grams_material',
      'grams_solvent',
      'type',
      'origin'
    ],
    result.materials.map((m) => [
      m.name,
      m.material_id,
      formulaId!!,
      m.grams,
      m.grams_material,
      m.grams_solvent,
      m.type,
      m.origin
    ])
  );

  const formula = await getFormula(formulaId!!);

  formulae.drafts.unshift(formula);

  return formula;
}

export async function cloneFormulaDraft(original: Formula) {
  const _db = await db();

  const { lastInsertId: formulaId } = await _db.execute(
    `
      INSERT INTO formulae(
        name,
        type,
        description,
        grams_total,
        grams_solvent
      ) 
      VALUES($1, $2, $3, $4, $5)
      `,
    [
      `${original.name} Copy`,
      original.type,
      original.description,
      original.grams_total,
      original.grams_solvent
    ]
  );

  if (original.materials.length > 0) {
    await insertValues(
      'formula_materials',
      [
        'name',
        'material_id',
        'formula_id',
        'grams',
        'grams_material',
        'grams_solvent',
        'type',
        'origin'
      ],
      original.materials.map((material) => [
        material.name,
        material.material_id,
        formulaId!!,
        material.grams,
        material.grams_material,
        material.grams_solvent,
        material.type,
        material.origin
      ])
    );
  }

  const formula = await getFormula(formulaId!!);

  formulae.drafts.unshift(formula);

  return formula;
}

export async function spendFormulaDraft(draft: Formula) {
  const _db = await db();

  const result = calculateFormulaBuilder(toBuilder(draft));

  const { lastInsertId: formulaId } = await _db.execute(
    `
      INSERT INTO formulae(
        name,
        type,
        description,
        grams_total,
        grams_solvent,
        grams_available
      ) 
      VALUES($1, $2, $3, $4, $5, $6)
      `,
    [
      draft.name,
      'MIXTURE',
      draft.description,
      draft.grams_total,
      draft.grams_solvent,
      draft.grams_total
    ]
  );

  await _db.execute(
    `
    INSERT INTO formula_materials(
      name,
      material_id,
      formula_id,
      grams,
      grams_material,
      grams_solvent,
      type,
      origin
    )
    SELECT 
      name,
      material_id,
      ${formulaId},
      grams,
      grams_material,
      grams_solvent,
      type,
      origin
    FROM formula_materials WHERE formula_id = $1
  `,
    [draft.id]
  );

  const formula = await getFormula(formulaId!!);

  await spendMaterialsFormula(formula.id, formula.name, result.materials);

  formulae.formulae.unshift(formula);

  return formula;
}

export async function updateFormula(id: number, state: FormulaBuilder) {
  const _db = await db();

  const result = calculateFormulaBuilder(state);

  const grams_total = result.totalMass;

  await _db.execute(
    `
      UPDATE formulae SET
        name = $1,
        description = $2,
        grams_total = $3,
        grams_solvent = $4
      WHERE id = $5
      `,
    [state.name, state.description, grams_total, state.solvent, id]
  );

  await _db.execute(`DELETE FROM formula_materials WHERE formula_id = $1`, [id]);

  await insertValues(
    'formula_materials',
    [
      'name',
      'material_id',
      'formula_id',
      'grams',
      'grams_material',
      'grams_solvent',
      'type',
      'origin'
    ],
    result.materials.map((m) => [
      m.name,
      m.material_id,
      id,
      m.grams,
      m.grams_material,
      m.grams_solvent,
      m.type,
      m.origin
    ])
  );

  const formula = await getFormula(id);

  formulae.swapDraft(formula);
}

export async function insertFormulaNote(
  formulaId: number,
  content: string,
  type: FormulaType
): Promise<FormulaNote> {
  const _db = await db();

  const { lastInsertId: noteId } = await _db.execute(
    `
      INSERT INTO formula_notes(formula_id, content, created_at)
      VALUES($1, $2, $3);
    `,
    [formulaId, content, date(now(getLocalTimeZone()))]
  );

  const note: FormulaNote[] = await _db.select(
    `
      SELECT id, formula_id, content, created_at FROM formula_notes WHERE id = $1 LIMIT 1
    `,
    [noteId]
  );

  if (type === 'MIXTURE') {
    formulae.formulae.find((f) => f.id === formulaId)?.notes.unshift(note[0]!!);
  } else if (type === 'DRAFT') {
    formulae.drafts.find((f) => f.id === formulaId)?.notes.unshift(note[0]!!);
  }

  return note[0];
}

export async function updateFormulaNote(noteId: number, content: string) {
  const _db = await db();

  await _db.execute(
    `
      UPDATE formula_notes SET content = $1 WHERE id = $2
    `,
    [content, noteId]
  );
}

export async function deleteFormulaNote(formulaId: number, noteId: number): Promise<void> {
  const _db = await db();
  await _db.execute(`DELETE FROM formula_notes WHERE id = $1`, [noteId]);
  const formula = formulae.formulae.find((f) => f.id === formulaId);
  if (formula) {
    formula.notes = formula.notes.filter((n) => n.id !== noteId);
  }
  const draft = formulae.drafts.find((f) => f.id === formulaId);
  if (draft) {
    draft.notes = draft.notes.filter((n) => n.id !== noteId);
  }
}

export async function listFormulae(): Promise<Formula[]> {
  const _db = await db();

  const formulae: Formula[] = await _db.select(
    `
       SELECT 
        id, 
        type,
        name,
        description,
        grams_total,
        grams_solvent,
        grams_available,
        created_at
       FROM formulae 
       ORDER BY created_at DESC
      `
  );

  for (const formula of formulae) {
    formula.materials = await _db.select(
      `
      SELECT
        name,
        material_id,
        formula_id,
        grams,
        grams_material,
        grams_solvent,
        type,
        origin
      FROM formula_materials
      WHERE formula_id = $1
    `,
      [formula.id]
    );

    formula.notes = await _db.select(
      `
      SELECT id, formula_id, content, created_at FROM formula_notes
      WHERE formula_id = $1
      ORDER BY created_at DESC
    `,
      [formula.id]
    );
  }

  return formulae;
}

export async function deleteFormula(type: FormulaType, id: number) {
  const _db = await db();

  await _db.execute(`DELETE FROM formulae WHERE id = $1`, [id]);
  await _db.execute(`DELETE FROM formula_materials WHERE formula_id = $1`, [id]);

  if (type === 'MIXTURE') {
    formulae.formulae = formulae.formulae.filter((f) => f.id !== id);
  } else if (type === 'DRAFT') {
    formulae.drafts = formulae.drafts.filter((f) => f.id !== id);
  }
}

export async function getFormula(id: number): Promise<Formula> {
  const _db = await db();

  const formulae: Formula[] = await _db.select(
    `
       SELECT 
        id,
        type,
        name,
        description,
        grams_total,
        grams_solvent,
        grams_available,
        created_at
       FROM formulae WHERE id = $1 LIMIT 1
      `,
    [id]
  );

  const materials: FormulaMaterial[] = await _db.select(
    `
      SELECT 
        name,
        material_id,
        formula_id,
        grams,
        grams_material,
        grams_solvent,
        type,
        origin
      FROM formula_materials
      WHERE formula_id = $1
    `,
    [id]
  );

  const notes: FormulaNote[] = await _db.select(
    `
      SELECT id, formula_id, content, created_at FROM formula_notes
      WHERE formula_id = $1
      ORDER BY created_at DESC
    `,
    [id]
  );

  formulae[0].materials = materials;
  formulae[0].notes = notes;

  return formulae[0];
}

/**
 * Delete the formula with the given ID and resupply the material inventory
 * with the materials used to create it.
 */
export async function undoFormula(id: number) {
  await restoreMaterials(id);
  await deleteFormula('MIXTURE', id);
}
