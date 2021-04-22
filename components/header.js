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
            <em style={{ color: "#a5abfb" }}>Orchi</em>dex
            <sup>v{p.version}</sup>
          </a>
        </Link>
      </h1>

      <nav>
        <Link href="/viz">
          <a className={router.pathname === "/viz" ? "active" : undefined}>
            Treemap
          </a>
        </Link>
        <Link href="/recent">
          <a className={router.pathname === "/recent" ? "active" : undefined}>
            Recent
          </a>
        </Link>

        <Link href="/learn/hybridizer">
          <a
            className={
              router.pathname === "/learn/hybridizer" ? "active" : undefined
            }
          >
            Hybridizer
          </a>
        </Link>
      </nav>
    </header>
  );
};
