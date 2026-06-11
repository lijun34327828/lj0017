CREATE TABLE IF NOT EXISTS image_files (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    filename TEXT NOT NULL UNIQUE,
    mimetype TEXT NOT NULL,
    size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    upload_time INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS repair_tasks (
    id TEXT PRIMARY KEY,
    image_id TEXT NOT NULL,
    preprocess_config TEXT NOT NULL,
    repair_options TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER NOT NULL DEFAULT 0,
    progress_message TEXT,
    original_url TEXT NOT NULL,
    processed_url TEXT,
    created_at INTEGER NOT NULL,
    started_at INTEGER,
    completed_at INTEGER,
    error TEXT,
    FOREIGN KEY (image_id) REFERENCES image_files(id)
);

CREATE TABLE IF NOT EXISTS export_records (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    format TEXT NOT NULL,
    quality INTEGER NOT NULL,
    adjustments TEXT NOT NULL,
    filename TEXT NOT NULL,
    export_time INTEGER NOT NULL,
    FOREIGN KEY (task_id) REFERENCES repair_tasks(id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON repair_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON repair_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exports_task ON export_records(task_id);
