import Link from "next/link";

export default function Home() {
  return (
    <>
      <div>Hello World!</div>
      <Link href="/customers">Customers</Link>
    </>
  );
}
