import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f7f4] px-5 py-16 text-[#242424]">
      <section className="w-full max-w-xl text-center">
        <Link
          href="/"
          aria-label="CNC Roraima — página inicial"
          className="mb-12 inline-flex items-center gap-2 text-sm font-bold tracking-wide text-[#a30d19] transition-opacity hover:opacity-75"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#a30d19] text-lg font-black text-white">
            CNC
          </span>
          <span>CNC RORAIMA</span>
        </Link>

        <div className="relative mx-auto mb-5 flex h-36 w-36 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[#a30d19]/15" />
          <div className="absolute inset-3 rounded-full border border-[#c9a45c]/50" />
          <span className="font-serif text-6xl font-bold tracking-tight text-[#a30d19]">404</span>
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[#a30d19]">
          Página não encontrada
        </p>
        <h1 className="font-serif text-3xl font-bold leading-tight sm:text-4xl">
          Parece que esta notícia saiu do ar.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-neutral-600">
          O endereço pode estar incorreto ou a página pode ter sido movida. Volte ao início
          e continue acompanhando as notícias de Roraima.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#a30d19] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#850a14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a30d19]"
          >
            Voltar para a página inicial
          </Link>
        </div>

        <div className="mx-auto mt-12 h-px w-16 bg-[#c9a45c]" />
        <p className="mt-4 text-xs text-neutral-500">
          CNC Roraima · Informação com contexto.
        </p>
      </section>
    </main>
  );
}
