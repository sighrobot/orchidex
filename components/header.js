import Link from "next/link";

export const Header = () => {
  return (
    <header>
      <h1>
        <Link href="/">
          <a>Orchidex</a>
        </Link>
      </h1>

      <nav>
        <Link href="/search">
          <a>Search</a>
        </Link>
      </nav>
    </header>
  );
};
