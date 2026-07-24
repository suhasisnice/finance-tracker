export default function StatCard({ label, value, colorClass, sub, glassClass }) {
  return (
    <div className={`card ${glassClass || ""}`}>
      <div className="card-label">{label}</div>
      <div className={`card-value mono ${colorClass || ""}`}>{value}</div>
      {sub && <div className="card-sub">{sub}</div>}
    </div>
  );
}
