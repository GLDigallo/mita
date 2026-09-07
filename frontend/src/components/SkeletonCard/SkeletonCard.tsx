function SkeletonCard() {
  const brillo = 'animate-brillar bg-[linear-gradient(100deg,#eeece6_40%,#f7f5f0_50%,#eeece6_60%)] bg-[length:200%_100%]'

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-borde)] bg-[var(--color-superficie)]"
      aria-hidden="true"
    >
      <div className={`${brillo} aspect-[4/5]`} />
      <div className="flex flex-col gap-2.5 p-4">
        <div className={`${brillo} h-[11px] w-[35%] rounded-md`} />
        <div className={`${brillo} h-3.5 w-full rounded-md`} />
        <div className={`${brillo} h-3.5 w-[60%] rounded-md`} />
      </div>
    </div>
  )
}

export default SkeletonCard