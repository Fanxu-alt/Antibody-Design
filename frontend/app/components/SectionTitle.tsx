export default function SectionTitle({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
        {label}
      </p>
      <h1 className="mb-3 text-3xl font-bold text-slate-950">{title}</h1>
      <p className="max-w-4xl leading-7 text-slate-600">{description}</p>
    </div>
  );
}
