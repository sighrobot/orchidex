-- to dedupe the source:
-- awk '!seen[$1]++' data.tsv > new.tsv

-- to run on production:
-- psql $POSTGRES_URL -f init.sql

DROP TABLE IF EXISTS rhs;
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
    pollen_parent_epithet_normalized TEXT
);
\COPY rhs FROM 'rhs/data.tsv' DELIMITER E'\t' CSV HEADER;

CREATE INDEX idx_rhs_genus_epithet ON rhs (genus, epithet);
CREATE INDEX rhs_searchable_text_trgm_gist_idx ON rhs USING gist((
    COALESCE(epithet, '') || ' ' ||
    COALESCE(genus, '') || ' ' ||
    COALESCE(registrant_name, '')
) gist_trgm_ops(siglen=256));

ALTER TABLE rhs ADD seed_parent_id TEXT;
ALTER TABLE rhs ADD pollen_parent_id TEXT;

-- populate seed_parent_id
UPDATE rhs
SET seed_parent_id=subquery.seed_parent_id
FROM (
    SELECT r1.id, r2.id AS seed_parent_id
    FROM rhs r1
    LEFT JOIN rhs r2
        ON r1.seed_parent_genus = r2.genus
        AND r1.seed_parent_epithet = r2.epithet
) AS subquery
WHERE rhs.id=subquery.id
    AND rhs.epithet != ''
    AND rhs.date_of_registration != ''
    AND rhs.seed_parent_id is NULL;

-- populate pollen_parent_id
UPDATE rhs
SET pollen_parent_id=subquery.pollen_parent_id
FROM (
    SELECT r1.id, r2.id AS pollen_parent_id
    FROM rhs r1
    LEFT JOIN rhs r2
        ON r1.pollen_parent_genus = r2.genus
        AND r1.pollen_parent_epithet = r2.epithet
) AS subquery
WHERE rhs.id=subquery.id
    AND rhs.epithet != ''
    AND rhs.date_of_registration != ''
    AND rhs.pollen_parent_id is NULL;