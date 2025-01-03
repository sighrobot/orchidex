// IDEAS

// This is the only Dendrobium registered by Yip Sow Yen
// This is the only hybrid registered by Yip Sow Yen
// This is the only primary hybrid registered by Yip Sow Yen
// This is the only intergeneric primary hybrid registered by Yip Sow Yen

// This is the only registered hybrid of <seed parent>...
// This is the only registered hybrid of <pollen parent>...
// This is the only registered primary hybrid of <seed parent>...
// This is the only registered primary hybrid of <pollen parent>...
// This is the only registered integeneric primary hybrid of <seed parent>...
// This is the only registered integeneric primary hybrid of <pollen parent>...

// This was the only registered hybrid of <year>

import { Grex, Stat } from './types';
import { capitalize } from './utils';

const escape = (s) => s.replace(/'/g, "''");

export const getStatSql = ({ stat, grex }: { stat: Stat; grex: Grex }) => {
  const escaped = escape(grex.registrant_name);

  switch (stat) {
    case 'registrant_genus_pct':
      return `
        SELECT
            (CAST(count(*) AS FLOAT) / (SELECT count(*) FROM rhs WHERE registrant_name = '${escaped}' AND epithet != '') ) as pct
        FROM rhs
        WHERE genus = '${grex.genus}' AND epithet != ''
        AND registrant_name = '${escaped}'
      `;
    case 'seed_parent_registrants':
      return `SELECT 
      rhs2.registrant_name r2,
      COUNT(*)::INT c
    FROM 
      rhs rhs1
      JOIN rhs rhs2 
        ON rhs1.seed_parent_genus = rhs2.genus 
        AND rhs1.seed_parent_epithet = rhs2.epithet 
        AND rhs2.registrant_name != ''
        AND rhs2.registrant_name not like 'This is a natural hybrid%'
    WHERE  rhs1.registrant_name = '${escaped}' OR rhs1.originator_name = '${escaped}'
    GROUP BY 
    rhs2.registrant_name ORDER BY c DESC, r2 LIMIT 5;
    `;
    case 'pollen_parent_registrants':
      return `SELECT
          rhs2.registrant_name r2,
          COUNT(*)::INT c
        FROM
          rhs rhs1
          JOIN rhs rhs2
            ON rhs1.pollen_parent_genus = rhs2.genus
            AND rhs1.pollen_parent_epithet = rhs2.epithet
            AND rhs2.registrant_name != ''
            AND rhs2.registrant_name not like 'This is a natural hybrid%'
        WHERE rhs1.registrant_name = '${escaped}' OR rhs1.originator_name = '${escaped}'
        GROUP BY
        rhs2.registrant_name ORDER BY c DESC, r2 LIMIT 5;
        `;
    case 'seed_parent_originators':
      return `SELECT
          rhs2.originator_name r2,
          COUNT(*)::INT c
        FROM
          rhs rhs1
          JOIN rhs rhs2
            ON rhs1.seed_parent_genus = rhs2.genus
            AND rhs1.seed_parent_epithet = rhs2.epithet
            AND rhs2.originator_name != ''
            AND rhs2.originator_name not like 'This is a natural hybrid%'
        WHERE rhs1.registrant_name = '${escaped}' OR rhs1.originator_name = '${escaped}'
        GROUP BY
        rhs2.originator_name ORDER BY c DESC, r2 LIMIT 5;
        `;
    case 'pollen_parent_originators':
      return `SELECT
            rhs2.originator_name r2,
            COUNT(*)::INT c
          FROM
            rhs rhs1
            JOIN rhs rhs2
              ON rhs1.pollen_parent_genus = rhs2.genus
              AND rhs1.pollen_parent_epithet = rhs2.epithet
              AND rhs2.originator_name != ''
              AND rhs2.originator_name not like 'This is a natural hybrid%'
          WHERE rhs1.registrant_name = '${escaped}' OR rhs1.originator_name = '${escaped}'
          GROUP BY
          rhs2.originator_name order by c desc, r2 LIMIT 5;
          `;
    case 'year_genus_pct':
      return `SELECT
          (CAST(count(*) AS FLOAT) / (SELECT count(*)::INT FROM rhs WHERE substr(date_of_registration, 0, 5) = '${grex.date_of_registration.slice(
            0,
            4
          )}') ) as pct
      FROM rhs
      WHERE genus = '${
        grex.genus
      }' AND epithet != '' AND substr(date_of_registration, 0, 5) = '${grex.date_of_registration.slice(
        0,
        4
      )}'
    `;
    default:
      return '';
  }
};

export const getStatTitle = ({ stat }: { stat: Stat }) => {
  switch (stat) {
    case 'registrant_genus_pct':
      return 'Genus by Registrant';
    case 'seed_parent_registrants':
      return 'Top Seed Parent Registrants';
    case 'pollen_parent_registrants':
      return 'Top Pollen Parent Registrants';
    case 'seed_parent_originators':
      return 'Top Seed Parent Originators';
    case 'pollen_parent_originators':
      return 'Top Pollen Parent Originators';
    case 'year_genus_pct':
      return 'Genus By Year';
    default:
      return stat;
  }
};

export const getStatText = ({
  stat,
  grex,
  value,
}: {
  stat: Stat;
  grex: Grex;
  value: number;
}) => {
  switch (stat) {
    case 'registrant_genus_pct': {
      const isLow = value < 0.01;
      return `${
        isLow ? 'Less than 1' : Math.round(value * 100)
      }% of hybrids registered by ${grex.registrant_name} are ${grex.genus}.`;
    }
    case 'year_genus_pct': {
      const thisYear = new Date().getFullYear().toString();
      const year = grex.date_of_registration?.slice(0, 4);
      const isLow = value < 0.01;

      const segments = [
        isLow ? 'less than 1%' : `${Math.round(value * 100)}%`,
        'of all hybrids registered in',
        year,
        'are',
        `${grex.genus}.`,
      ];

      if (year === thisYear) {
        segments.unshift('To date, ');
      }

      segments[0] = capitalize(segments[0]);

      return segments.join(' ');
    }
    default:
      return '';
  }
};
