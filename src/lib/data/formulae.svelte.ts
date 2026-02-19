import { getLocalTimeZone, now } from '@internationalized/date';
import { db, insertValues } from '../db';
import { restoreMaterials, spendMaterials } from './materials.svelte';
import type { Formula, FormulaBuilder, FormulaMaterial, FormulaNote } from '../types';
import { date } from '../utils';

export type FormulaState = {
  formulae: Formula<'MIXTURE'>[];
  drafts: Formula<'DRAFT'>[];

  get: (id: number) => Formula<'MIXTURE'> | undefined;
  getDraft: (id: number) => Formula<'DRAFT'> | undefined;
};

export let formulae: FormulaState = $state<FormulaState>({
  formulae: [],
  drafts: [],

  get(id: number) {
    console.log('getting', id);
    return this.formulae.find((f) => f.id === id);
  },

  getDraft(id: number) {
    return this.drafts.find((f) => f.id === id);
  }
});

export type FormulaType = 'MIXTURE' | 'DRAFT';

export async function initFormulae() {
  const f = await listFormulae();
  for (const formula of f) {
    if (formula.type === 'DRAFT') {
      formulae.drafts.unshift(formula as Formula<'DRAFT'>);
    } else if (formula.type === 'MIXTURE') {
      formulae.formulae.unshift(formula as Formula<'MIXTURE'>);
    }
  }
  console.log($state.snapshot(formulae.drafts));
  console.log($state.snapshot(formulae.formulae));
}

export async function insertFormula(state: FormulaBuilder): Promise<Formula<typeof state.type>> {
  const _db = await db();
  const { lastInsertId: formulaId } = await _db.execute(
    `
      INSERT INTO formulae(
        name,
        type,
        description,
        grams_total
      ) 
      VALUES($1, $2, $3, $4)
      `,
    [state.name, state.type, state.description, state.targetGrams]
  );

  await insertValues(
    'formula_materials',
    ['material_id', 'formula_id', 'grams'],
    state.materials.map((material) => [material.original.id, formulaId!!, material.grams])
  );

  const formula = await getFormula(formulaId!!);

  if (formula.type === 'DRAFT') {
    formulae.drafts.unshift(formula as Formula<'DRAFT'>);
  } else if (formula.type === 'MIXTURE') {
    formulae.formulae.unshift(formula as Formula<'MIXTURE'>);
  }

  if (state.type === 'MIXTURE') {
    await spendMaterials('FORMULA', formulaId!!, state.materials);
  }

  return formula;
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
}

export async function listFormulae(): Promise<Formula<FormulaType>[]> {
  const _db = await db();

  const formulae: Formula<FormulaType>[] = await _db.select(
    `
       SELECT 
        id, 
        type,
        name,
        description,
        grams_total,
        created_at
       FROM formulae 
       ORDER BY created_at DESC
      `
  );

  for (const formula of formulae) {
    formula.materials = await _db.select(
      `
      SELECT material_id, formula_id, grams FROM formula_materials
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

export async function deleteFormula(id: number) {
  const _db = await db();

  await _db.execute(`DELETE FROM formulae WHERE id = $1`, [id]);

  formulae.formulae = formulae.formulae.filter((f) => f.id !== id);
}

export async function getFormula(id: number): Promise<Formula<FormulaType>> {
  const _db = await db();

  const formulae: Formula<FormulaType>[] = await _db.select(
    `
       SELECT 
        id,
        type,
        name,
        description,
        grams_total,
        created_at
       FROM formulae WHERE id = $1 LIMIT 1
      `,
    [id]
  );

  const materials: FormulaMaterial[] = await _db.select(
    `
      SELECT material_id, formula_id, grams FROM formula_materials
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
  await deleteFormula(id);
}
