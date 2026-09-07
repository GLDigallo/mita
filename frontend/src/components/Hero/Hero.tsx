function Hero() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#1e1b4b_0%,#4f46e5_55%,#7c3aed_100%)] py-20 text-center text-white md:py-28">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 85% 20%, rgba(255,255,255,0.14), transparent 50%), radial-gradient(ellipse at 15% 80%, rgba(255,255,255,0.08), transparent 50%)',
        }}
      />
      <div className="relative mx-auto max-w-[820px] px-5">
        <p className="mx-auto mb-5 inline-block rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[13px] font-semibold uppercase tracking-[0.12em] backdrop-blur-sm">
          Grupo de tiendas · Corrientes Capital
        </p>
        <h1 className="text-[clamp(34px,9vw,48px)] font-bold leading-[1.1]">
          Una tienda para <span className="bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">cada etapa</span> de tu pibe
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-relaxed text-white/85">
          Desde los primeros días hasta la adolescencia: 4 tiendas con nombre propio y moda pensada
          para cada edad. Elegí la tuya y entrá directo.
        </p>
        <a
          href="#tiendas"
          className="mt-9 inline-block rounded-full bg-white px-9 py-4 text-[17px] font-semibold text-[#1e1b4b] shadow-[var(--shadow-md)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
        >
          Elegí tu tienda
        </a>
      </div>
    </section>
  )
}

export default Hero