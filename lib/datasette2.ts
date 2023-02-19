export const query = async (expr: string) => {
  if (!expr) return null;
  const fetched = await fetch(
    `https://data.orchidex.org/orchidex.json?_shape=objects&sql=${encodeURIComponent(
      expr,
    )}`,
  );
  const json = await fetched.json();
  return new Response(JSON.stringify(json.rows));
};
