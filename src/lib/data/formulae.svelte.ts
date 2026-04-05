import { getLocalTimeZone, now } from '@internationalized/date';
import { db, insertValues } from '../db';
import { materials, restoreMaterials, spendMaterials } from './materials.svelte';
import type {
  Formula,
  FormulaBuilder,
  FormulaMaterial,
  FormulaNote,
  FormulaType,
  MaterialSpend,
  MixtureSpend
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
};

export type FormulaEntry = {
  id: number;
  type: FormulaEntryType;
  name: string;
  amountGrams: number;

  /**
   * Includes solvent if it's a dilution.
   */
  amountGramsFull: number;
  amountPercent?: number;
  amountPPT?: number;
  entries: FormulaEntry[];

  /**
   * Used to determine the total amount of solvent formulae add to the mix
   */
  totalSolventMass?: number;

  /**
   * Derived from totalSolventMass
   */
  totalSolventPercent?: number;

  /**
   * Derived from totalSolventPercent
   */
  totalSolventPPT?: number;
};

export type FormulaEntryType = 'FORMULA' | 'MATERIAL';

export function toBuilder(formula: Formula) {
  const _materials: MaterialSpend[] = [];
  const mixtures: MixtureSpend[] = [];

  for (const material of formula.materials) {
    if (material.type === 'MATERIAL') {
      _materials.push({
        original: materials.get(material.material_id)!!,
        grams: material.grams
      });
    }

    if (material.type === 'MIXTURE') {
      mixtures.push({ original: formulae.get(material.material_id)!!, grams: material.grams });
    }
  }

  return {
    name: formula.name,
    description: formula.description ?? undefined,
    materials: _materials,
    solvent: formula.grams_total - formula.materials.reduce((acc, m) => acc + m.grams, 0),
    mixtures: mixtures,
    reset() {
      this.name = formula.name;
      this.description = formula.description ?? undefined;
      this.materials = _materials;
      this.solvent = formula.grams_total - formula.materials.reduce((acc, m) => acc + m.grams, 0);
      this.mixtures = [];
    }
  };
}

export function calculateFormula(formula: Formula): FormulaResult {
  const result: FormulaResult = {
    totalMaterials: 0,
    materialMass: 0,
    materialPercent: 0,
    materialPPT: 0,
    totalMass: 0,
    addedSolventMass: 0,
    materialSolventMass: 0,
    solventPercent: 0,
    solventPPT: 0,
    entries: []
  };

  // Root materials

  for (const material of formula.materials) {
    if (material.type === 'MATERIAL') {
      result.totalMass += material.grams;
      result.totalMaterials += 1;

      const materialParent = materials.get(material.material_id);

      if (materialParent == null) {
        result.materialMass += material.grams;
        result.entries.push({
          id: material.material_id,
          name: material.name,
          amountGrams: material.grams,
          entries: [],
          type: 'MATERIAL',
          amountGramsFull: material.grams
        });
        continue;
      }

      const gm = materialParent.grams_material;
      const gs = materialParent.grams_solvent;

      if (gm != null && gs != null) {
        const ratio = gm / (gm + gs);
        const amount = material.grams * ratio;

        result.materialSolventMass += material.grams - amount;
        result.materialMass += amount;
        result.entries.push({
          id: material.material_id,
          name: material.name,
          amountGrams: amount,
          entries: [],
          type: 'MATERIAL',
          amountGramsFull: material.grams
        });
      } else {
        result.materialMass += material.grams;
        result.entries.push({
          id: material.material_id,
          name: material.name,
          amountGrams: material.grams,
          entries: [],
          type: 'MATERIAL',
          amountGramsFull: material.grams
        });
      }
    }

    if (material.type === 'MIXTURE') {
      const materialParent = formulae.get(material.material_id);

      if (materialParent == null) {
        result.materialMass += material.grams;
        result.entries.push({
          id: material.material_id,
          name: material.name,
          amountGrams: material.grams,
          entries: [],
          type: 'MATERIAL',
          amountGramsFull: material.grams
        });
        continue;
      }

      mixInFormula(result, materialParent, material.grams);
    }
  }

  calculatePercentage(result, result.entries);

  console.log(formula);
  console.log(formula.grams_total);
  console.log(result.totalMass);

  return result;
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
    entries: []
  };

  // Root materials

  for (const material of formula.materials) {
    result.totalMaterials += 1;

    result.totalMass += material.grams;

    const gm = material.original.grams_material;
    const gs = material.original.grams_solvent;

    if (gm != null && gs != null) {
      const ratio = gm / (gm + gs);
      const amount = material.grams * ratio;

      result.materialSolventMass += material.grams - amount;
      result.materialMass += amount;
      result.entries.push({
        id: material.original.id,
        name: material.original.name ?? '',
        amountGrams: amount,
        entries: [],
        type: 'MATERIAL',
        amountGramsFull: material.grams
      });
    } else {
      result.materialMass += material.grams;
      result.entries.push({
        id: material.original.id,
        name: material.original.name ?? '',
        amountGrams: material.grams,
        entries: [],
        type: 'MATERIAL',
        amountGramsFull: material.grams
      });
    }
  }

  // Recurse through mixtures

  for (const mix of formula.mixtures) {
    mixInFormula(result, mix.original, mix.grams);
  }

  calculatePercentage(result, result.entries);

  return result;
}

function calculatePercentage(result: FormulaResult, entries: FormulaEntry[]) {
  for (const entry of entries) {
    if (entry.type === 'FORMULA') {
      calculatePercentage(result, entry.entries);
      entry.amountPercent = entry.entries.reduce((acc, e) => acc + e.amountPercent!!, 0);
      entry.amountPPT = parseInt((entry.amountPercent * 1000).toFixed(0));
    } else {
      entry.amountPercent = entry.amountGrams / result.totalMass;
      entry.amountPPT = parseInt((entry.amountPercent * 1000).toFixed(0));
    }
  }

  result.solventPercent = (result.materialSolventMass + result.addedSolventMass) / result.totalMass;
  result.solventPPT = parseInt((result.solventPercent * 1000).toFixed(0));

  result.materialPercent = result.materialMass / result.totalMass;
  result.materialPPT = parseInt((result.materialPercent * 1000).toFixed(0));
}

function mixInFormula(result: FormulaResult, formula: Formula, amount: number) {
  const entry: FormulaEntry = {
    id: formula.id,
    name: formula.name,
    amountGrams: 0,
    entries: [],
    type: 'FORMULA',
    amountGramsFull: amount,
    totalSolventMass: amount
  };

  result.addedSolventMass += (formula.grams_solvent / formula.grams_total) * amount;
  result.totalMass += amount;

  let materialMassStart = result.materialMass;

  for (const material of formula.materials) {
    if (material.type === 'MIXTURE') {
      const formulaParent = formulae.get(material.material_id);
      if (formulaParent != null) {
        mixInFormula(result, formulaParent, material.grams);
      }
      continue;
    }

    result.totalMaterials += 1;

    const materialParent = materials.get(material.material_id);
    if (materialParent == null) {
      continue;
    }

    const gm = materialParent.grams_material;
    const gs = materialParent.grams_solvent;

    if (gm != null && gs != null) {
      const ratio = gm / (gm + gs);

      const materialGrams = material.grams * ratio;
      const materialAmount = materialGrams * amount;
      const solventAmount =
        (material.grams / formula.grams_total - materialGrams / material.grams) * amount;

      result.materialMass += materialAmount;
      result.materialSolventMass += solventAmount;

      entry.totalSolventMass! -= materialAmount;

      entry.entries.push({
        id: materialParent.id,
        name: materialParent.name ?? '',
        amountGrams: materialAmount,
        entries: [],
        type: 'MATERIAL',
        amountGramsFull: material.grams,
        totalSolventMass: solventAmount
      });
    } else {
      const materialAmount = (material.grams / formula.grams_total) * amount;

      result.materialMass += materialAmount;
      entry.totalSolventMass! -= materialAmount;

      entry.entries.push({
        id: materialParent.id,
        name: materialParent.name ?? '',
        amountGrams: (material.grams / formula.grams_total) * amount,
        entries: [],
        type: 'MATERIAL',
        amountGramsFull: material.grams
      });
    }
  }

  entry.amountGrams = result.materialMass - materialMassStart;
  entry.totalSolventPercent = entry.totalSolventMass! / amount;
  entry.totalSolventPPT = parseInt((entry.totalSolventPercent * 1000).toFixed(0));

  result.entries.push(entry);
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

  const grams_total =
    state.solvent +
    state.materials.reduce((acc, m) => acc + m.grams, 0) +
    state.mixtures.reduce((acc, m) => acc + m.grams, 0);

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

  const values = state.materials.map((material) => [
    material.original.name,
    material.original.id,
    formulaId!!,
    material.grams,
    'MATERIAL'
  ]);

  for (const mix of state.mixtures) {
    values.push([mix.original.name, mix.original.id, formulaId!!, mix.grams, 'MIXTURE']);
  }

  await insertValues(
    'formula_materials',
    ['name', 'material_id', 'formula_id', 'grams', 'type'],
    values
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
      ['name', 'material_id', 'formula_id', 'grams', 'type'],
      original.materials.map((material) => [
        material.name,
        material.material_id,
        formulaId!!,
        material.grams,
        material.type
      ])
    );
  }

  const formula = await getFormula(formulaId!!);

  formulae.drafts.unshift(formula);

  return formula;
}

export async function spendFormulaDraft(draft: Formula) {
  const _db = await db();
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

  await insertValues(
    'formula_materials',
    ['name', 'material_id', 'formula_id', 'grams', 'type'],
    draft.materials.map((material) => [
      material.name,
      material.material_id,
      formulaId!!,
      material.grams,
      'MATERIAL'
    ])
  );

  const formula = await getFormula(formulaId!!);

  await spendMaterials(
    'FORMULA',
    formulaId!!,
    draft.materials.map((m) => {
      return { original: materials.get(m.material_id)!!, grams: m.grams };
    })
  );

  formulae.formulae.unshift(formula);

  return formula;
}

export async function updateFormula(id: number, state: FormulaBuilder) {
  const _db = await db();

  const grams_total =
    state.solvent +
    state.materials.reduce((acc, m) => acc + m.grams, 0) +
    state.mixtures.reduce((acc, m) => acc + m.grams, 0);

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

  const values = state.materials.map((material) => [
    material.original.name,
    material.original.id,
    id,
    material.grams,
    'MATERIAL'
  ]);

  for (const mix of state.mixtures) {
    values.push([mix.original.name, mix.original.id, id, mix.grams, 'MIXTURE']);
  }

  await insertValues(
    'formula_materials',
    ['name', 'material_id', 'formula_id', 'grams', 'type'],
    values
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
      SELECT name, material_id, formula_id, grams, type FROM formula_materials
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
      SELECT name, material_id, formula_id, grams, type FROM formula_materials
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

  console.log(formulae[0]);
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
