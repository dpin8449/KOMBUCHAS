CREATE TABLE batch (
    id VARCHAR PRIMARY KEY,
    type VARCHAR NOT NULL,
    start_date DATE,
    end_date DATE,
    days INTEGER,
    origin_batch_id VARCHAR REFERENCES batch(id),
    temperature INTEGER,
    comment TEXT,
    result VARCHAR,
    refreshment VARCHAR,
    production VARCHAR,
    total_time INTEGER,
    final_status VARCHAR
);
