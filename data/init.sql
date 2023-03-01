.mode csv
.separator "\t"
.import rhs/data.tsv rhs
CREATE INDEX idx_rhs_genus_epithet ON rhs (genus, epithet);
.separator "|"
.import wcvp/data.csv wcvp
