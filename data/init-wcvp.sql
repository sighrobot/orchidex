-- prefilter by family Orchidaceae
-- awk -F "|" '$5 == "Orchidaceae"' wcvp_names.csv > data.csv

-- to run on production:
-- psql $POSTGRES_URL -f init-wcvp.sql

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
