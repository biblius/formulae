import { getLocalTimeZone, now } from '@internationalized/date';
import { db, insertValues } from './db';
import { spendMaterials } from './materials.svelte';
import type { Formula, FormulaBuilder, FormulaMaterial, FormulaNote } from './types';
import { date } from './utils';

export type FormulaState = {
  formulae: Formula[];
  initialized: boolean;

  get: (id: number) => Formula | undefined;
};

export let formulae: FormulaState = $state<FormulaState>({
  formulae: [],
  initialized: false,

  get(id: number) {
    return this.formulae.find((f) => f.id === id);
  }
});

export async function initFormulae() {
  if (formulae.initialized) return;
  formulae.formulae = await listFormulae();
  formulae.initialized = true;
}

export async function insertFormula(state: FormulaBuilder): Promise<Formula> {
  const _db = await db();
  const { lastInsertId: formulaId } = await _db.execute(
    `
      INSERT INTO formulae(
        name,
        description,
        grams_total
      ) 
      VALUES($1, $2, $3)
      `,
    [state.name, state.description, state.targetGrams]
  );

  await insertValues(
    'formula_materials',
    ['material_id', 'formula_id', 'grams'],
    state.materials.map((material) => [material.original.id, formulaId!!, material.grams])
  );

  const formula = await getFormula(formulaId!!);

  formulae.formulae.unshift(formula);

  await spendMaterials('FORMULA', formulaId!!, state.materials);

  return formula;
}

export async function insertFormulaNote(formulaId: number, content: string): Promise<FormulaNote> {
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

  formulae.formulae.find((f) => f.id === formulaId)?.notes.push(note[0]!!);

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

export async function listFormulae(): Promise<Formula[]> {
  const _db = await db();

  const formulae: Formula[] = await _db.select(
    `
       SELECT 
        id, 
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

export async function getFormula(id: number): Promise<Formula> {
  const _db = await db();

  const formulae: Formula[] = await _db.select(
    `
       SELECT 
        id, 
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
