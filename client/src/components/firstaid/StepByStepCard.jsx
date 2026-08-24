function StepByStepCard({ guide }) {
  return <article className="panel procedure"><div className="panel-head"><span>{guide.urgency} · FIRST AID</span><small>Offline ready</small></div><h2>{guide.title}</h2><p className="warning">{guide.warning}</p><ol>{guide.steps.map((s) => <li key={s}>{s}</li>)}</ol><footer>For life-threatening symptoms or uncertainty, call 112 / local emergency services.</footer></article>;
}
export {
  StepByStepCard
};
