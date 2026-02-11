import { db, insertValues } from './db';
import type {
  Material,
  MaterialAbstract,
  MaterialAbstractAdd,
  MaterialAbstractEdit,
  MaterialDilutionAdd,
  MaterialHistory,
  MaterialInstanceAdd,
  MaterialSpend
} from './types';
import { date } from './utils';

export type MaterialState = {
  abstract: MaterialAbstract[];
  inventory: Material[];
  initialized: boolean;

  get: (id: number) => Material | undefined;
  getAbstract: (id: number) => MaterialAbstract | undefined;
  swapAbstract: (material: MaterialAbstract) => void;
};

export let materials: MaterialState = $state<MaterialState>({
  abstract: [],
  inventory: [],
  initialized: false,

  get(id: number): Material | undefined {
    return this.inventory.find((m) => m.id === id);
  },

  getAbstract(id: number): MaterialAbstract | undefined {
    return this.abstract.find((m) => m.id === id);
  },

  swapAbstract(material: MaterialAbstract) {
    const i = this.abstract.findIndex((m) => m.id === material.id);
    if (i !== -1) {
      this.abstract[i] = material;
    }
  }
});

export async function initMaterials() {
  if (materials.initialized) return;
  materials.abstract = await listMaterialsAbstract();
  materials.inventory = await listMaterials();
  materials.initialized = true;
}

/**
 * EO - essential oil
 * SY - synthetic
 * NA - natural absolute
 */
export type MaterialType = 'EO' | 'SY' | 'NA';

export type MaterialTargetType = 'FORMULA' | 'DILUTION';

export type MaterialInstanceType = 'PURE' | 'DILUTION';

export const MATERIAL_TYPES: MaterialType[] = ['EO', 'SY', 'NA'];

export function materialType(input: MaterialType): string {
  switch (input) {
    case 'EO':
      return 'Essential oil';
    case 'SY':
      return 'Synthetic';
    case 'NA':
      return 'Absolute';
  }
}

export async function insertMaterialAbstract(
  state: MaterialAbstractAdd
): Promise<MaterialAbstract> {
  const _db = await db();
  const { lastInsertId: materialId } = await _db.execute(
    `
      INSERT INTO materials_abstract(
        name,
        description,
        type,
        family,
        subfamily,
        cas_number
      ) 
      VALUES($1, $2, $3, $4, $5, $6)
      `,
    [state.name, state.description, state.type, state.family, state.subfamily, state.cas]
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

  materials.abstract.unshift(material);

  return material;
}

export async function insertMaterialInstance(
  materialId: number,
  state: MaterialInstanceAdd
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
      materialId,
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

  materials.inventory.push(material);

  return material;
}

export async function insertMaterialDilution(state: MaterialDilutionAdd): Promise<Material> {
  const _db = await db();

  if (state.gramsMaterial > state.material!!.grams_available) {
    throw `Not enough material ${state.material!!.id}: ${state.material?.grams_available} / ${state.gramsMaterial}`;
  }

  let gramsDiluted = null;
  if (state.material?.grams_material != null && state.material.grams_solvent != null) {
    let concentration =
      state.material.grams_material /
      (state.material.grams_material + state.material.grams_solvent);
    gramsDiluted = state.gramsMaterial * concentration;
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
      gramsDiluted != null ? gramsDiluted : state.gramsMaterial,
      state.gramsTotal - state.gramsMaterial,
      date(state.createdAt!!)
    ]
  );

  const spend = [{ original: state.material!!, grams: state.gramsMaterial }];

  await spendMaterials('DILUTION', dilutionId!!, spend);

  const dilution = await getMaterial(dilutionId!!);

  materials.inventory.push(dilution);

  return dilution;
}

export async function listMaterialsAbstract(): Promise<MaterialAbstract[]> {
  const _db = await db();

  let materials: MaterialAbstract[] = await _db.select(`
       SELECT id, name, description, type, family, subfamily, cas_number 
       FROM materials_abstract
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

  return materials;
}

export async function updateMaterialAbstract(id: number, update: MaterialAbstractEdit) {
  const _db = await db();

  await _db.execute(
    `
      UPDATE materials_abstract SET
        name = $1,
        description = $2,
        type = $3,
        family = $4,
        subfamily = $5,
        cas_number = $6
      WHERE id = $7
      `,
    [update.name, update.description, update.type, update.family, update.subfamily, update.cas, id]
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
  materials.abstract = materials.abstract.filter((m) => m.id !== id);
  materials.inventory = materials.inventory.filter((m) => m.material_id !== id);
}

export async function deleteMaterial(id: number) {
  const _db = await db();
  await _db.execute('DELETE FROM materials WHERE id = $1', [id]);
  materials.inventory = materials.inventory.filter((m) => m.id !== id);
}

export async function getMaterialAbstract(id: number): Promise<MaterialAbstract> {
  const _db = await db();

  let materials: MaterialAbstract[] = await _db.select(
    `
       SELECT id, name, description, type, family, subfamily, cas_number 
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

export async function spendMaterials(
  target: MaterialTargetType,
  targetId: number,
  materials: MaterialSpend[]
) {
  const _db = await db();

  await insertValues(
    'material_history',
    ['material_id', 'target_id', 'target_type', 'grams'],
    materials.map((material) => [material.original.id, targetId, target, material.grams])
  );

  for (const material of materials) {
    _db.execute(`UPDATE materials SET grams_available = grams_available - $1 WHERE id = $2`, [
      material.grams,
      material.original.id
    ]);
    material.original.grams_available -= material.grams;
  }
}

export async function listMaterialHistory(
  type: MaterialTargetType
): Promise<Record<number, MaterialHistory[]>> {
  const _db = await db();

  const history: MaterialHistory[] = await _db.select(
    `SELECT id, material_id, target_id, target_type, grams, created_at FROM material_history WHERE target_type = $1 ORDER BY created_at DESC`,
    [type]
  );

  const out: Record<number, MaterialHistory[]> = {};

  for (const item of history) {
    if (out[item.target_id]) {
      out[item.target_id].push(item);
    } else {
      out[item.target_id] = [item];
    }
  }

  return out;
}
