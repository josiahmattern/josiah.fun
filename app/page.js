// app/page.js
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-base-100 text-base-content px-4 py-10">
      {/* HERO */}
      <section className="text-center max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          welcome to my game website
        </h1>
        <p className="text-sm sm:text-base text-base-content/70 mb-6">
          small party games. quick to learn. built for friends.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/wordimposter"
            className="btn btn-primary px-6 text-sm sm:text-base"
          >
            ▶ play word imposter
          </Link>
          <a
            href="https://josiah.digital"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost px-6 text-sm sm:text-base"
          >
            about
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-12 text-center text-xs sm:text-sm text-base-content/60">
        © {new Date().getFullYear()} josiah.digital
      </footer>
    </main>
  );
}

