import { db, insertValues } from './db';
import type {
  Material,
  MaterialAbstract,
  MaterialAbstractAdd,
  MaterialInstanceAdd,
  MaterialLink,
  MaterialTag
} from './types';

export type MaterialState = {
  abstract: MaterialAbstract[];
  inventory: Material[];
  initialized: boolean;
};

export let materials: MaterialState = $state({
  abstract: [],
  inventory: [],
  initialized: false
});

export async function initMaterials() {
  if (materials.initialized) return;
  materials.abstract = await listMaterialsAbstract();
  materials.inventory = await listMaterials();
  materials.initialized = true;
}

/**
 * EO - essential oil
 * AC - aromachemical (synthetic)
 * RES - resin
 * NA - natural absolute
 */
export type MaterialType = 'EO' | 'AC' | 'RES' | 'NA';

export const MATERIAL_TYPES: MaterialType[] = ['EO', 'AC', 'RES', 'NA'];

export function materialType(input: MaterialType): string {
  switch (input) {
    case 'EO':
      return 'Essential oil';
    case 'AC':
      return 'Aromachemical';
    case 'RES':
      return 'Resin';
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

export async function insertMaterialInstance(state: MaterialInstanceAdd): Promise<Material> {
  const _db = await db();
  const { lastInsertId } = await _db.execute(
    `
      INSERT INTO materials(
        material_id,
        name,
        manufacturer,
        batch_id,
        link,
        grams_available,
        grams_initial,
        created_at
      ) 
      VALUES($1, $2, $3, $4, $5, $6, $7)
      `,
    [
      parseInt(state.materialId!!),
      state.name,
      state.manufacturer,
      state.batchId,
      state.link,
      state.amount,
      state.amount,
      state.createdAt
    ]
  );

  const material = await getMaterial(lastInsertId!!);

  materials.inventory.push(material);

  return material;
}

export async function listMaterialsAbstract(): Promise<MaterialAbstract[]> {
  const _db = await db();

  let materials: MaterialAbstract[] = await _db.select(`
       SELECT id, name, description, type, family, subfamily, cas_number 
       FROM materials_abstract
      `);

  for (const material of materials) {
    const tags = await _db.select<MaterialTag[]>(
      `SELECT material_id, value, color
       FROM material_tags
       WHERE material_id = $1`,
      [material.id]
    );

    material.tags = tags;

    const links = await _db.select<MaterialLink[]>(
      `SELECT material_id, value
       FROM material_links
       WHERE material_id = $1`,
      [material.id]
    );

    material.links = links;
  }

  return materials;
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
        predilution,
        created_at
       FROM materials
      `);
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
    const tags = await _db.select<MaterialTag[]>(
      `SELECT material_id, value, color
       FROM material_tags
       WHERE material_id = $1`,
      [material.id]
    );

    material.tags = tags;

    const links = await _db.select<MaterialLink[]>(
      `SELECT material_id, value
       FROM material_links
       WHERE material_id = $1`,
      [material.id]
    );

    material.links = links;
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
        manufacturer,
        batch_id,
        link,
        grams_available,
        created_at
       FROM materials WHERE id = $1 LIMIT 1
      `,
    [id]
  );

  return materials[0];
}
