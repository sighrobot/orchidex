import { redirect } from 'next/navigation';

export default async function VizGenus({ params }) {
  redirect(`/learn/parentage/${params.genus.toLowerCase()}`);
}
