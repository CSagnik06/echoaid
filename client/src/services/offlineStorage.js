const FIRST_AID = [
  { title: "CPR", category: "Cardiac emergency", urgency: "RED", warning: "Only begin if the person is unresponsive and not breathing normally.", steps: ["Call 112 or ask someone to call emergency services and get an AED.", "Place both hands in the centre of the chest and push hard and fast, 100\u2013120 compressions a minute.", "Allow the chest to fully rise between compressions; use an AED as soon as available."] },
  { title: "Severe Bleeding", category: "Trauma", urgency: "RED", warning: "Life-threatening bleeding needs emergency care immediately.", steps: ["Call 112. Apply firm, continuous pressure with clean cloth or bandage.", "Keep the person lying down and warm; do not remove soaked dressings.", "If trained, use a tourniquet above limb bleeding; note the time applied."] },
  { title: "Burns", category: "Thermal injury", urgency: "YELLOW", warning: "Seek urgent care for large, deep, electrical, chemical, face, hand, foot, or genital burns.", steps: ["Cool under cool running water for 20 minutes; remove jewellery if not stuck.", "Cover loosely with clean non-fluffy dressing or cling film.", "Do not use ice, creams, butter, or burst blisters."] },
  { title: "Choking", category: "Airway emergency", urgency: "RED", warning: "Call emergency services if the person cannot breathe, cough, or speak.", steps: ["Encourage coughing if they can cough effectively.", "Give up to five firm back blows between the shoulder blades.", "Give up to five abdominal thrusts for adults; alternate until help arrives or object clears."] },
  { title: "Heatstroke", category: "Heat illness", urgency: "RED", warning: "Confusion, collapse, or very hot skin in heat can be life-threatening.", steps: ["Call 112 and move the person to a cool shaded area.", "Remove excess clothing and cool quickly with wet cloths, fanning, or cool water.", "If fully alert, give small sips of cool water; do not force fluids."] }
];
const key = "sanjeevani-first-aid";
function getFirstAid() {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || FIRST_AID;
  } catch {
    return FIRST_AID;
  }
}
function cacheFirstAid() {
  try {
    localStorage.setItem(key, JSON.stringify(FIRST_AID));
  } catch {
  }
}
export {
  FIRST_AID,
  cacheFirstAid,
  getFirstAid
};
