import Link from "next/link";
import { useRouter } from "next/router";
import { Magic } from "./search/magic";

export const Header = () => {
  const router = useRouter();

  const handleSubmit = ({ genus, epithet }) => {
    const params = [];

    if (genus) {
      params.push(`genus=${genus}`);
    }

    if (epithet) {
      params.push(`epithet=${epithet}`);
    }

    router.push(`/?${params.join("&")}`);
  };

  const handleChange = (grex) => {
    if (grex) {
      router.push(`/grex/${grex.id}`);
    }
  };

  return (
    <header>
      <h1>
        <Link href="/">
          <a>
            <em style={{ color: "#a5abfb" }}>Orchi</em>dex
          </a>
        </Link>
      </h1>

      <nav>
        {/* <Link href="/viz">
          <a className={router.pathname === "/viz" ? "active" : undefined}>
            Treemap
          </a>
        </Link> */}

        <Magic onChange={handleChange} onSubmit={handleSubmit} />

        <Link href="/recent">
          <a
            title="Recently registered"
            className={router.pathname === "/recent" ? "active" : undefined}
          >
            &#x029D7;
          </a>
        </Link>

        <Link href="/learn/hybridizer">
          <a
            className={
              router.pathname === "/learn/hybridizer" ? "active" : undefined
            }
          >
            &#x02697;
          </a>
        </Link>
      </nav>
    </header>
  );
};
