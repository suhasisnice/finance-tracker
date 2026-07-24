// Roadmap of planned ML upgrades. Each current baseline module ships behind a
// swappable interface; these cards name the model intended to replace it in
// Review 2.

const ROADMAP = [
  {
    title: "SpaCy NER",
    replaces: "Rule-based categorizer & regex SMS parser",
    detail: "Named-entity recognition to extract merchants and categorise free-text descriptions beyond a fixed keyword list.",
  },
  {
    title: "LSTM",
    replaces: "Least-squares forecast",
    detail: "A sequence model over monthly history to capture seasonality and non-linear trends the linear fit can't.",
  },
  {
    title: "Isolation Forest",
    replaces: "Per-category 2σ anomaly rule",
    detail: "Unsupervised multi-feature outlier detection across amount, category, timing and merchant together.",
  },
];

export default function RoadmapPanel() {
  return (
    <div className="card">
      <div className="section-header" style={{ marginBottom: 6 }}>
        <span className="panel-heading">Roadmap</span>
        <span className="muted text-xs">ML upgrades</span>
      </div>
      <p className="muted text-sm" style={{ marginBottom: 14 }}>
        Today's insights use deterministic and statistical baselines. Each sits behind a
        swappable interface, ready to be replaced by these models.
      </p>
      <div className="roadmap-grid">
        {ROADMAP.map((r) => (
          <div className="roadmap-card" key={r.title}>
            <div className="roadmap-card-head">
              <span className="roadmap-title">{r.title}</span>
              <span className="roadmap-badge">Planned — Review 2</span>
            </div>
            <div className="roadmap-replaces">Replaces: {r.replaces}</div>
            <div className="roadmap-detail">{r.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
