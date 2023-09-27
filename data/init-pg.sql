-- to dedupe the source:
-- awk '!seen[$1]++' data.tsv > new.tsv

-- to run on production:
-- psql $POSTGRES_URL -f init-pg.sql

-- RHS
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
ALTER TABLE rhs ADD seed_parent_id TEXT;
ALTER TABLE rhs ADD pollen_parent_id TEXT;

UPDATE rhs
SET seed_parent_id=subquery.seed_parent_id
FROM (
    SELECT r1.id, r2.id AS seed_parent_id
    FROM rhs r1
    LEFT JOIN rhs r2
        ON r1.seed_parent_genus = r2.genus
        AND r1.seed_parent_epithet = r2.epithet
) AS subquery
WHERE rhs.id=subquery.id;

UPDATE rhs
SET pollen_parent_id=subquery.pollen_parent_id
FROM (
    SELECT r1.id, r2.id AS pollen_parent_id
    FROM rhs r1
    LEFT JOIN rhs r2
        ON r1.pollen_parent_genus = r2.genus
        AND r1.pollen_parent_epithet = r2.epithet
) AS subquery
WHERE rhs.id=subquery.id;


-- WCVP
DROP TABLE IF EXISTS wcvp;
CREATE TABLE wcvp (
    plant_name_id TEXT,
    ipni_id TEXT,
    taxon_rank TEXT,
    taxon_status TEXT,
    family TEXT,
    genus_hybrid TEXT,
    genus TEXT,
    species_hybrid TEXT,
    species TEXT,
    infraspecific_rank TEXT,
    infraspecies TEXT,
    parenthetical_author TEXT,
    primary_author TEXT,
    publication_author TEXT,
    place_of_publication TEXT,
    volume_and_page TEXT,
    first_published TEXT,
    nomenclatural_remarks TEXT,
    geographic_area TEXT,
    lifeform_description TEXT,
    climate_description TEXT,
    taxon_name TEXT,
    taxon_authors TEXT,
    accepted_plant_name_id TEXT,
    basionym_plant_name_id TEXT,
    replaced_synonym_author TEXT,
    homotypic_synonym TEXT,
    parent_plant_name_id TEXT,
    powo_id TEXT,
    hybrid_formula TEXT,
    reviewed TEXT
);
\COPY wcvp FROM 'wcvp/data.csv' DELIMITER '|' QUOTE E'\b' CSV HEADER;
-- QUOTE E'\b' is because there are some random " chars in this data and pg will complain
