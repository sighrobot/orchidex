import Link from "next/link";

const p = require("../package.json");

export const Header = () => {
  return (
    <header>
      <h1>
        <em style={{ color: "crimson" }}>Orchi</em>dex<sup>v{p.version}</sup>
      </h1>

      <nav>
        <Link href="/">
          <a>Home</a>
        </Link>
        <Link href="/search">
          <a>Search</a>
        </Link>
      </nav>
    </header>
  );
};
