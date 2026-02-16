import { db, insertValues } from '$lib/db';
import type { Trial, TrialAdd, TrialNote } from '$lib/types';
import { getLocalTimeZone, now } from '@internationalized/date';
import { materials } from './materials.svelte';
import { date } from '$lib/utils';

export type TrialState = {
  trials: Trial[];
};

export let trials: TrialState = $state<TrialState>({
  trials: []
});

export async function initTrials() {
  trials.trials = await listTrials();
}

export async function insertTrial(data: TrialAdd) {
  const _db = await db();

  const { lastInsertId: trialId } = await _db.execute(
    `
    INSERT INTO trials(name, description, created_at)
    VALUES ($1, $2, $3)
  `,
    [data.name!!, data.description!!, date(now(getLocalTimeZone()))]
  );

  await insertValues(
    'trial_materials',
    ['trial_id', 'material_id'],
    data.materials.map((m) => [trialId!!, m])
  );

  const trial = await getTrial(trialId!!);

  trials.trials.unshift(trial!!);
}

export async function getTrial(id: number): Promise<Trial | null> {
  const _db = await db();

  let trialRow: any[] = await _db.select(
    `
       SELECT id, name, description, created_at
       FROM trials
       WHERE id = $1
       LIMIT 1
      `,
    [id]
  );

  if (trialRow.length !== 1) {
    return null;
  }

  const trial: Trial = {
    id: trialRow[0].id,
    name: trialRow[0].name,
    description: trialRow[0].description,
    created_at: trialRow[0].created_at,
    materials: [],
    notes: []
  };

  trial.notes = await _db.select<any[]>(
    `SELECT id, content, created_at FROM trial_notes
       WHERE trial_id = $1
      `,
    [trial.id]
  );

  const materialIds = await _db.select<any[]>(
    `SELECT material_id FROM trial_materials
       WHERE trial_id = $1
      `,
    [trial.id]
  );

  for (const { material_id } of materialIds) {
    const m = materials.getAbstract(material_id);
    if (m) {
      trial.materials.push(m);
    }
  }

  return trial;
}

export async function listTrials(): Promise<Trial[]> {
  const _db = await db();

  let trialRows: any[] = await _db.select(`
       SELECT id, name, description, created_at
       FROM trials
      `);

  const out = [];

  for (const trialRow of trialRows) {
    const trial: Trial = {
      id: trialRow.id,
      name: trialRow.name,
      description: trialRow.description,
      created_at: trialRow.created_at,
      materials: [],
      notes: []
    };

    trial.notes = await _db.select<any[]>(
      `SELECT id, trial_id, content, created_at FROM trial_notes
       WHERE trial_id = $1
      `,
      [trialRow.id]
    );

    const materialIds = await _db.select<any[]>(
      `SELECT material_id FROM trial_materials
       WHERE trial_id = $1
      `,
      [trialRow.id]
    );

    for (const { material_id } of materialIds) {
      trial.materials.push(material_id);
    }

    trial.notes.sort((a, b) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf());

    out.push(trial);
  }

  return out;
}

export async function insertTrialNote(trialId: number, content: string): Promise<TrialNote> {
  const _db = await db();

  const { lastInsertId: noteId } = await _db.execute(
    `
      INSERT INTO trial_notes(trial_id, content, created_at)
      VALUES($1, $2, $3);
    `,
    [trialId, content, date(now(getLocalTimeZone()))]
  );

  const note: TrialNote[] = await _db.select(
    `
      SELECT id, trial_id, content, created_at FROM trial_notes WHERE id = $1 LIMIT 1
    `,
    [noteId]
  );

  trials.trials.find((t) => t.id === trialId)?.notes.unshift(note[0]!!);

  return note[0];
}

export async function updateTrialNote(noteId: number, content: string) {
  const _db = await db();

  await _db.execute(
    `
      UPDATE trial_notes SET content = $1 WHERE id = $2
    `,
    [content, noteId]
  );
}

export async function deleteTrialNote(trialId: number, noteId: number): Promise<void> {
  const _db = await db();
  await _db.execute(`DELETE FROM trial_notes WHERE id = $1`, [noteId]);
  const trial = trials.trials.find((t) => t.id === trialId);
  if (trial) {
    trial.notes = trial.notes.filter((n) => n.id !== noteId);
  }
}

export async function deleteTrial(id: number) {
  const _db = await db();

  await _db.execute(`DELETE FROM trials WHERE id = $1`, [id]);

  trials.trials = trials.trials.filter((t) => t.id !== id);
}
