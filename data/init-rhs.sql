-- to replace local csv with a rebuild
-- \copy (SELECT * FROM rhs_rebuild ORDER BY id::int DESC) to 'data.csv' with (FORMAT CSV, HEADER);

-- to run on production:
-- psql $POSTGRES_URL -f init-rhs.sql

DROP TABLE IF EXISTS rhs;
DROP INDEX IF EXISTS idx_rhs_seed_parent_id;
DROP INDEX IF EXISTS idx_rhs_pollen_parent_id;
DROP INDEX IF EXISTS idx_rhs_genus_epithet;
DROP INDEX IF EXISTS rhs_searchable_text_trgm_gist_idx;

CREATE TABLE rhs (
    id text PRIMARY KEY,
    genus TEXT,
    epithet TEXT,
    synonym_flag TEXT,
    synonym_genus_name TEXT,
    synonym_epithet_name TEXT,
    registrant_name TEXT,
    originator_name TEXT,
    date_of_registration TEXT,
    seed_parent_genus TEXT,
    seed_parent_epithet TEXT,
    pollen_parent_genus TEXT,
    pollen_parent_epithet TEXT,
    epithet_normalized TEXT,
    registrant_name_normalized TEXT,
    originator_name_normalized TEXT,
    seed_parent_epithet_normalized TEXT,
    pollen_parent_epithet_normalized TEXT,
    seed_parent_id TEXT,
    pollen_parent_id TEXT
);
\COPY rhs FROM 'rhs/data.csv' CSV HEADER;

CREATE INDEX idx_rhs_seed_parent_id ON rhs (seed_parent_id);
CREATE INDEX idx_rhs_pollen_parent_id ON rhs (pollen_parent_id);
CREATE INDEX idx_rhs_genus_epithet ON rhs (genus, epithet);
CREATE INDEX rhs_searchable_text_trgm_gist_idx ON rhs USING gist((
    COALESCE(epithet, '') || ' ' ||
    COALESCE(genus, '') || ' ' ||
    COALESCE(registrant_name, '')
) gist_trgm_ops(siglen=256));

-- populate seed_parent_id
-- THIS QUERY MUST STAY IN SYNC WITH scripts/update.js !!!
UPDATE rhs
SET seed_parent_id=subquery.seed_parent_id
FROM (
    SELECT r1.id, r2.id AS seed_parent_id
    FROM rhs r1
    LEFT JOIN rhs r2
        ON r2.genus = r1.seed_parent_genus
        AND r2.epithet like replace(r1.seed_parent_epithet, '�', '_')
) AS subquery
WHERE rhs.id=subquery.id
    AND rhs.epithet != ''
    AND rhs.date_of_registration != ''
    AND rhs.seed_parent_id is NULL;

-- populate pollen_parent_id
-- THIS QUERY MUST STAY IN SYNC WITH scripts/update.js !!!
UPDATE rhs
SET pollen_parent_id=subquery.pollen_parent_id
FROM (
    SELECT r1.id, r2.id AS pollen_parent_id
    FROM rhs r1
    LEFT JOIN rhs r2
        ON r2.genus = r1.pollen_parent_genus
        AND r2.epithet like replace(r1.pollen_parent_epithet, '�', '_')
) AS subquery
WHERE rhs.id=subquery.id
    AND rhs.epithet != ''
    AND rhs.date_of_registration != ''
    AND rhs.pollen_parent_id is NULL;

-- correct seed_parent_epithet
-- THIS QUERY MUST STAY IN SYNC WITH scripts/update.js !!!
UPDATE rhs
SET seed_parent_epithet=subquery.seed_parent_epithet
FROM (
    SELECT r1.id, r2.epithet AS seed_parent_epithet
    FROM rhs r1
    LEFT JOIN rhs r2
        ON r2.id = r1.seed_parent_id
) AS subquery
WHERE rhs.id=subquery.id
    AND rhs.seed_parent_epithet LIKE '%�%'
    AND rhs.epithet != ''
    AND rhs.date_of_registration != '';

-- correct pollen_parent_epithet
-- THIS QUERY MUST STAY IN SYNC WITH scripts/update.js !!!
UPDATE rhs
SET pollen_parent_epithet = subquery.pollen_parent_epithet
FROM (
    SELECT r1.id, r2.epithet AS pollen_parent_epithet
    FROM rhs r1
    LEFT JOIN rhs r2
        ON r2.id = r1.pollen_parent_id
) AS subquery
WHERE
  rhs.id = subquery.id
  AND rhs.pollen_parent_epithet LIKE '%�%'
  AND rhs.epithet != ''
  AND rhs.date_of_registration != '';
