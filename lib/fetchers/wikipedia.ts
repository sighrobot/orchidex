export async function fetchGenusMeta(genus) {
  //   if (!genus) return {};

  const fetched = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${genus}`
  );
  return fetched.json();
}
