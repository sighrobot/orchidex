import Link from "next/link";
import { useRouter } from "next/router";

const p = require("../package.json");

export const Header = () => {
  const router = useRouter();
  return (
    <header>
      <h1>
        <Link href="/">
          <a>
            <em style={{ color: "crimson" }}>Orchi</em>dex
            <sup>v{p.version}</sup>
          </a>
        </Link>
      </h1>

      <nav>
        <Link href="/search">
          <a className={router.pathname === "/search" ? "active" : undefined}>
            Search
          </a>
        </Link>
      </nav>
    </header>
  );
};
