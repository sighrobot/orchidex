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
        <Link href="/recents">
          <a className={router.pathname === "/recents" ? "active" : undefined}>
            Recents
          </a>
        </Link>

        <Link href="/viz">
          <a className={router.pathname === "/viz" ? "active" : undefined}>
            Viz
          </a>
        </Link>
      </nav>
    </header>
  );
};
