import { Pill } from 'components/pills/pill';
import { orderTerms } from 'lib/classify';
import styles from './pills.module.scss';

export {
  getDescriptor,
  isIntergeneric,
  isNaturalHybrid,
  isPrimary,
  isSpecies,
  orderTerms,
} from 'lib/classify';

export const Pills = ({ grex }) => {
  const pills = orderTerms(grex);

  if (pills.length === 0) {
    return null;
  }

  return (
    <div className={styles.pills}>
      <Pill types={pills} />
    </div>
  );
};
