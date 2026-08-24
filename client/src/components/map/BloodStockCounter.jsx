function BloodStockCounter({ facility }) {
  const b = facility?.bloodInventory || { OPlus: 42, OMinus: 5, APlus: 24, BPlus: 17 };
  return <section className="panel blood"><div className="panel-head"><span>BLOOD INVENTORY</span><small>{facility?.name || "Regional availability"}</small></div><div className="blood-grid">{Object.entries(b).map(([type, units]) => <div key={type} className={units < 6 ? "low" : ""}><b>{type.replace("Plus", "+").replace("Minus", "\u2212")}</b><span>{units} units</span><small>{units < 6 ? "LOW STOCK" : "AVAILABLE"}</small></div>)}</div></section>;
}
export {
  BloodStockCounter
};
