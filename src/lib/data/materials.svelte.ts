import { getLocalTimeZone, now } from '@internationalized/date';
import { db, insertValues } from '../db';
import type {
  FormulaMaterial,
  FormulaMaterialType,
  Material,
  MaterialAbstract,
  MaterialAbstractBuilder,
  MaterialDilutionBuilder,
  MaterialHistory,
  MaterialInstanceBuilder,
  MaterialRestore,
  MaterialSpend
} from '../types';
import { date } from '../utils';
import { formulae } from './formulae.svelte';

export type MaterialState = {
  historyD: HistoryEntry[];
  historyF: HistoryEntry[];

  /**
   * Gets a material from inventory.
   */
  get: (id: number) => Material | undefined;
  /**
   * Swaps a material in the inventory.
   */
  swap: (material: Material) => void;
  /**
   * Gets a material definition.
   */
  getAbstract: (id: number) => MaterialAbstract | undefined;
  /**
   * Swaps a material definition.
   */
  swapAbstract: (material: MaterialAbstract) => void;
  /**
   * Checks whether a material in the inventory is the target of a dilution.
   * Used to reason about undoing dilutions; If there is no entry in the
   * history which has the given `materialId` as the `target_id`, then
   * the material was already a predilution when it was entered in the inventory, i.e.
   * it was not diluted from another material from the inventory.
   */
  isDilutionTarget: (materialId: number) => boolean;

  /**
   * Return the whole material inventory.
   */
  inventory: () => Material[];

  /**
   * Return all material definitions.
   */
  definitions: () => MaterialAbstract[];

  definitionTotal: () => number;

  inventoryTotal: () => number;
};

type MaterialIndices = {
  abstract: Record<number, MaterialAbstract>;
  /**
   * Maps inventory IDs to their definitions.
   */
  inventory: Record<number, number>;
};

let indices = $state<MaterialIndices>({
  abstract: {},
  inventory: {}
});

export let materials: MaterialState = $state<MaterialState>({
  historyD: [],
  historyF: [],

  get(id: number): Material | undefined {
    const abs = indices.abstract[indices.inventory[id]];
    return abs?.inventory.find((i) => i.id === id);
  },

  swap(material: Material) {
    const abs = indices.abstract[indices.inventory[material.id]];
    const i = abs.inventory.findIndex((m) => m.id === material.id);
    if (i !== -1) {
      console.log('swapping', material.id);
      abs.inventory[i] = material;
    }
  },

  getAbstract(id: number): MaterialAbstract | undefined {
    return indices.abstract[id];
  },

  swapAbstract(material: MaterialAbstract) {
    indices.abstract[material.id] = material;
  },

  isDilutionTarget(materialId: number) {
    for (const entry of this.historyD) {
      if (entry.target_id === materialId) {
        if (entry.materials.length === 1 && materials.get(entry.materials[0].id)) {
          return true;
        }
      }
    }
    return false;
  },

  inventory() {
    return Object.values(indices.abstract).flatMap((a) => a.inventory);
  },

  definitions() {
    const out = Object.values(indices.abstract);
    out.sort((a, b) => b.id - a.id);
    return out;
  },

  definitionTotal() {
    return Object.keys(indices.abstract).length;
  },

  inventoryTotal() {
    return Object.keys(indices.inventory).length;
  }
});

export async function initMaterials() {
  const abstract = await listMaterialsAbstract();

  for (const material of abstract) {
    indices.abstract[material.id] = material;
  }

  const inventory = await listMaterials();

  for (const material of inventory) {
    indices.abstract[material.material_id].inventory.push(material);
    indices.inventory[material.id] = material.material_id;
  }

  materials.historyD = await listMaterialHistory('DILUTION');

  materials.historyF = await listMaterialHistory('FORMULA');
}

/**
 * EO - essential oil
 * SY - synthetic
 * NA - natural absolute
 */
export type MaterialType = 'EO' | 'SY' | 'NA' | 'CO2' | 'RES';

export type MaterialTargetType = 'FORMULA' | 'DILUTION';

export type MaterialInstanceType = 'PURE' | 'DILUTION';

export const MATERIAL_TYPES: MaterialType[] = ['EO', 'SY', 'NA', 'CO2', 'RES'];

export function materialType(input: MaterialType): string {
  switch (input) {
    case 'EO':
      return 'Essential oil';
    case 'SY':
      return 'Synthetic';
    case 'NA':
      return 'Absolute';
    case 'CO2':
      return 'CO2 extract';
    case 'RES':
      return 'Resin';
  }
}

export async function insertMaterialAbstract(
  state: MaterialAbstractBuilder
): Promise<MaterialAbstract> {
  const _db = await db();
  const { lastInsertId: materialId } = await _db.execute(
    `
      INSERT INTO materials_abstract(
        name,
        description,
        type,
        family,
        cas_number
      ) 
      VALUES($1, $2, $3, $4, $5)
      `,
    [state.name, state.description, state.type, state.family, state.cas]
  );

  if (state.tags.length > 0) {
    await insertValues(
      'material_tags',
      ['material_id', 'value'],
      state.tags.map((tag) => [materialId!!, tag])
    );
  }

  if (state.links.length > 0) {
    await insertValues(
      'material_links',
      ['material_id', 'value'],
      state.links.map((link) => [materialId!!, link])
    );
  }

  const material = await getMaterialAbstract(materialId!!);
  material.inventory = [];

  indices.abstract[material.id] = material;

  return material;
}

export async function insertMaterialInstance(
  abstractId: number,
  state: MaterialInstanceBuilder
): Promise<Material> {
  const _db = await db();

  let gramsMaterial = null;
  let gramsSolvent = null;
  let type: MaterialInstanceType = 'PURE';

  if (state.predilution != null && state.predilution > 0) {
    const predilution = state.predilution / 100;
    gramsMaterial = state.grams * predilution;
    gramsSolvent = state.grams - gramsMaterial;
    type = 'DILUTION';
  }

  const { lastInsertId } = await _db.execute(
    `
      INSERT INTO materials(
        material_id,
        name,
        type,
        manufacturer,
        batch_id,
        link,
        grams_available,
        grams_initial,
        grams_material,
        grams_solvent,
        created_at
      ) 
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
    [
      abstractId,
      state.name,
      type,
      state.manufacturer,
      state.batchId,
      state.link,
      state.grams,
      state.grams,
      gramsMaterial,
      gramsSolvent,
      date(state.createdAt!!)
    ]
  );

  const material = await getMaterial(lastInsertId!!);

  const abs = materials.getAbstract(abstractId);
  if (abs) {
    console.log($state.snapshot(abs));
    abs.inventory.push(material);
  }
  indices.inventory[material.id] = abstractId;

  return material;
}

export async function updateMaterialInstance(
  id: number,
  state: MaterialInstanceBuilder
): Promise<Material> {
  const _db = await db();

  let gramsMaterial = null;
  let gramsSolvent = null;
  let type: MaterialInstanceType = 'PURE';

  if (state.predilution != null && state.predilution > 0) {
    const predilution = state.predilution / 100;
    gramsMaterial = state.grams * predilution;
    gramsSolvent = state.grams - gramsMaterial;
    type = 'DILUTION';
  }

  await _db.execute(
    `
      UPDATE materials SET
         name = $1,
         type = $2,
         manufacturer = $3,
         batch_id = $4,
         link = $5,
         grams_available = $6,
         grams_initial = $7,
         grams_material = $8,
         grams_solvent = $9,
         created_at = $10
      WHERE id = $11
      `,
    [
      state.name,
      type,
      state.manufacturer,
      state.batchId,
      state.link,
      state.grams,
      state.grams,
      gramsMaterial,
      gramsSolvent,
      date(state.createdAt!!),
      id
    ]
  );

  const material = await getMaterial(id);

  materials.swap(material);

  return material;
}

export async function insertMaterialDilution(state: MaterialDilutionBuilder): Promise<Material> {
  const _db = await db();

  if (state.gramsMaterial > state.material!!.grams_available) {
    throw `Not enough material ${state.material!!.id}: ${state.material?.grams_available} / ${state.gramsMaterial}`;
  }

  if (!state.name) {
    throw `Must have name!`;
  }

  let gramsMaterial = state.gramsMaterial;

  if (state.material?.grams_material != null && state.material.grams_solvent != null) {
    let concentration =
      state.material.grams_material /
      (state.material.grams_material + state.material.grams_solvent);
    gramsMaterial = state.gramsMaterial * concentration;
  }

  const { lastInsertId: dilutionId } = await _db.execute(
    `
      INSERT INTO materials(
        material_id,
        instance_id,
        name,
        type,
        grams_available,
        grams_initial,
        grams_material,
        grams_solvent,
        created_at
      ) 
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
    [
      state.material!!.material_id,
      state.material!!.id,
      state.name,
      'DILUTION',
      state.gramsTotal,
      state.gramsTotal,
      gramsMaterial,
      state.gramsTotal - gramsMaterial,
      date(state.createdAt!!)
    ]
  );

  const spend = { original: state.material!!, grams: state.gramsMaterial };
  await spendMaterialDilution(dilutionId!!, state.name ?? '', spend);

  const dilution = await getMaterial(dilutionId!!);

  indices.abstract[state.material!!.material_id].inventory.push(dilution);
  indices.inventory[dilution.id] = state.material!!.material_id;

  return dilution;
}

export async function listMaterialsAbstract(): Promise<MaterialAbstract[]> {
  const _db = await db();

  let materials: MaterialAbstract[] = await _db.select(`
       SELECT id, name, description, type, family, cas_number 
       FROM materials_abstract ORDER BY id DESC
      `);

  for (const material of materials) {
    const tags = await _db.select<{ value: string }[]>(
      `SELECT value
       FROM material_tags
       WHERE material_id = $1`,
      [material.id]
    );

    material.tags = tags.map((t) => t.value);

    const links = await _db.select<{ value: string }[]>(
      `SELECT value
       FROM material_links
       WHERE material_id = $1`,
      [material.id]
    );

    material.links = links.map((l) => l.value);
  }

  return materials.map((m) => {
    m.inventory = [];
    return m;
  });
}

export async function updateMaterialAbstract(id: number, update: MaterialAbstractBuilder) {
  const _db = await db();

  await _db.execute(
    `
      UPDATE materials_abstract SET
        name = $1,
        description = $2,
        type = $3,
        family = $4,
        cas_number = $5
      WHERE id = $6
      `,
    [update.name, update.description, update.type, update.family, update.cas, id]
  );

  await _db.execute(`DELETE FROM material_tags WHERE material_id = $1`, [id]);
  if (update.tags.length > 0) {
    await insertValues(
      'material_tags',
      ['material_id', 'value'],
      update.tags.map((tag) => [id, tag])
    );
  }

  await _db.execute(`DELETE FROM material_links WHERE material_id = $1`, [id]);
  if (update.links.length > 0) {
    await insertValues(
      'material_links',
      ['material_id', 'value'],
      update.links.map((link) => [id, link])
    );
  }

  const material = await getMaterialAbstract(id);
  const abs = materials.getAbstract(id);
  if (abs) {
    material.inventory = abs.inventory;
  } else {
    material.inventory = [];
  }

  materials.swapAbstract(material);
}

export async function listMaterials(): Promise<Material[]> {
  const _db = await db();

  return _db.select(`
       SELECT 
        id,
        material_id,
        type,
        name,
        manufacturer,
        batch_id,
        link,
        grams_available,
        grams_initial,
        grams_material,
        grams_solvent,
        created_at
       FROM materials
      `);
}

export async function deleteMaterialAbstract(id: number) {
  const _db = await db();
  await _db.execute('DELETE FROM materials_abstract WHERE id = $1', [id]);
  delete indices.abstract[id];
}

export async function deleteMaterial(id: number) {
  const _db = await db();
  await _db.execute('DELETE FROM materials WHERE id = $1', [id]);
  const absId = indices.inventory[id];
  if (absId == null) {
    return;
  }
  const material = materials.getAbstract(absId);
  if (material) {
    material.inventory = material.inventory.filter((m) => m.id !== id);
  }
  for (const f of formulae.formulae) {
    f.materials = f.materials.filter((m) => m.material_id !== id);
  }
  for (const f of formulae.drafts) {
    f.materials = f.materials.filter((m) => m.material_id !== id);
  }
  delete indices.inventory[id];
}

export async function getMaterialAbstract(id: number): Promise<MaterialAbstract> {
  const _db = await db();

  let materials: MaterialAbstract[] = await _db.select(
    `
       SELECT id, name, description, type, family, cas_number 
       FROM materials_abstract WHERE id = $1 LIMIT 1
      `,
    [id]
  );

  for (const material of materials) {
    const tags = await _db.select<{ value: string }[]>(
      `SELECT value
       FROM material_tags
       WHERE material_id = $1`,
      [material.id]
    );

    material.tags = tags.map((t) => t.value);

    const links = await _db.select<{ value: string }[]>(
      `SELECT value
       FROM material_links
       WHERE material_id = $1`,
      [material.id]
    );

    material.links = links.map((l) => l.value);
  }

  return materials[0];
}

export async function getMaterial(id: number): Promise<Material> {
  const _db = await db();

  let materials: Material[] = await _db.select(
    `
       SELECT 
        id, 
        material_id,
        name,
        type,
        manufacturer,
        batch_id,
        link,
        grams_available,
        grams_initial,
        grams_material,
        grams_solvent,
        created_at
       FROM materials WHERE id = $1 LIMIT 1
      `,
    [id]
  );

  return materials[0];
}

export async function spendMaterialDilution(
  targetId: number,
  targetName: string,
  spend: MaterialSpend
) {
  console.log('spending materials', $state.snapshot(spend));

  const _db = await db();
  const created_at = date(now(getLocalTimeZone()));

  await insertValues(
    'material_history',
    [
      'source_id',
      'source_name',
      'target_id',
      'target_name',
      'target_type',
      'type',
      'grams',
      'created_at'
    ],
    [
      [
        spend.original.id,
        spend.original.name ?? '',
        targetId,
        targetName,
        'DILUTION',
        'MATERIAL',
        spend.grams,
        created_at
      ]
    ]
  );

  await _db.execute(`UPDATE materials SET grams_available = grams_available - $1 WHERE id = $2`, [
    spend.grams,
    spend.original.id
  ]);

  const original = materials.get(spend.original.id)!;
  original.grams_available -= spend.grams;

  const entry: HistoryEntry = {
    target_id: targetId,
    target_name: targetName,
    created_at,
    materials: [
      {
        id: spend.original.id,
        name: spend.original.name ?? '',
        grams: spend.grams,
        type: 'MATERIAL'
      }
    ],
    target: 'DILUTION'
  };

  materials.historyD.unshift(entry);
}

export async function spendMaterialsFormula(
  targetId: number,
  targetName: string,
  spend: FormulaMaterial[]
) {
  console.log('spending materials', $state.snapshot(spend));

  const _db = await db();
  const created_at = date(now(getLocalTimeZone()));

  await insertValues(
    'material_history',
    [
      'source_id',
      'source_name',
      'target_id',
      'target_name',
      'target_type',
      'type',
      'grams',
      'created_at'
    ],
    spend.map((material) => [
      material.material_id,
      material.name,
      targetId,
      targetName,
      'FORMULA',
      material.type,
      material.grams,
      created_at
    ])
  );

  for (const material of spend) {
    if (material.type === 'MATERIAL') {
      await _db.execute(
        `UPDATE materials SET grams_available = grams_available - $1 WHERE id = $2`,
        [material.grams, material.material_id]
      );
      const original = materials.get(material.material_id)!;
      original.grams_available -= material.grams;
    }

    if (material.type === 'MIXTURE') {
      await _db.execute(
        `UPDATE formulae SET grams_available = grams_available - $1 WHERE id = $2`,
        [material.grams, material.material_id]
      );
      const original = formulae.get(material.material_id)!;
      original.grams_available -= material.grams;
    }
  }

  const entry = spend.reduce(
    (acc: HistoryEntry, el) => {
      acc.materials.push({ name: el.name, id: el.material_id, grams: el.grams, type: el.type });
      return acc;
    },
    { target_name: targetName, target: 'FORMULA', target_id: targetId, materials: [], created_at }
  );

  materials.historyF.unshift(entry);
}

export async function restoreMaterials(targetId: number) {
  const _db = await db();

  const materialsRestore = await _db.select<MaterialRestore[]>(
    `
    SELECT 
      type as "source_type",
      target_type,
      source_id,
      grams
    FROM material_history
    WHERE target_id = $1
  `,
    [targetId]
  );

  let targetType = null;

  console.log('restoring materials', materialsRestore);

  for (const { source_id, source_type, grams, target_type } of materialsRestore) {
    targetType = target_type;

    if (source_type === 'MATERIAL') {
      await _db.execute(
        `
          UPDATE materials 
          SET grams_available = grams_available + $1
          WHERE id = $2
        `,
        [grams, source_id]
      );

      materials.get(source_id)!!.grams_available += grams;
    }

    if (source_type === 'MIXTURE') {
      await _db.execute(
        `
          UPDATE formulae 
          SET grams_available = grams_available + $1
          WHERE id = $2
        `,
        [grams, source_id]
      );

      formulae.get(source_id)!!.grams_available += grams;
    }
  }

  console.log('deleting target from history', targetId);

  await _db.execute(
    `
    DELETE FROM material_history WHERE target_id = $1
  `,
    [targetId]
  );

  if (targetType === 'FORMULA') {
    materials.historyF = materials.historyF.filter((m) => m.target_id !== targetId);
  } else {
    materials.historyD = materials.historyD.filter((m) => m.target_id !== targetId);
  }
}

export type HistoryEntry = {
  target: MaterialTargetType;
  target_id: number;
  target_name: string;
  materials: { name: string; id: number; grams: number; type: FormulaMaterialType }[];
  created_at: string;
};

export async function listMaterialHistory(type: MaterialTargetType): Promise<HistoryEntry[]> {
  const _db = await db();

  const history: MaterialHistory[] = await _db.select(
    `SELECT 
      id,
      source_id,
      source_name,
      target_id,
      target_name,
      target_type,
      type,
      grams,
      created_at 
    FROM material_history WHERE target_type = $1`,
    [type]
  );

  const out: Record<number, HistoryEntry> = {};

  for (const item of history) {
    if (out[item.target_id]) {
      out[item.target_id].materials.push({
        id: item.source_id,
        name: item.source_name,
        grams: item.grams,
        type: item.type
      });
    } else {
      out[item.target_id] = {
        target: type,
        target_id: item.target_id,
        target_name: item.target_name,
        materials: [
          { id: item.source_id, name: item.source_name, grams: item.grams, type: item.type }
        ],
        created_at: item.created_at
      };
    }
  }

  const entries = Object.values(out);

  entries.sort((a, b) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf());

  return entries;
}

/**
 * Delete the formula with the given ID and resupply the material inventory
 * with the materials used to create it.
 */
export async function undoDilution(id: number) {
  await restoreMaterials(id);
  await deleteMaterial(id);
}
