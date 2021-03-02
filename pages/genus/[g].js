import { Container } from 'components/container';
import { useRouter } from 'next/router';

export const Genus = () => {
  const router = useRouter();
  const { g } = router.query;

  return (
    <Container>
      <h2>{g}</h2>
    </Container>
  );
};

export default Genus;
