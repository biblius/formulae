use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        // Define your migrations here
        Migration {
            version: 1,
            description: "init",
            sql: include_str!("../../migrations/20260202181428_init.up.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "Remove subfamily from materials_abstract.",
            sql: include_str!("../../migrations/20260212211043_remove_subfamily.up.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "Add scent strip trials",

            sql: include_str!("../../migrations/20260214122708_trials.up.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "Add formula types",

            sql: include_str!("../../migrations/20260219121759_formula_types.up.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "Drop delete cascade on materials instance_id relation",

            sql: include_str!(
                "../../migrations/20260228175744_materials_remove_cascade_on_instance.up.sql"
            ),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "Add type to formula materials",

            sql: include_str!("../../migrations/20260321090015_formula_materials_type.up.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "Remove FK constraint from formula materials",

            sql: include_str!("../../migrations/20260405165519_formula_materials_remove_fk.up.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "Rework material history",

            sql: include_str!(
                "../../migrations/20260409123954_formula_material_history_rework.up.sql"
            ),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations("sqlite:formulae.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
