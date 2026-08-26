import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { localToday } from "../../services/cycleCalculations";

const idOf = item => item?._id || item?.id;
const shown = new Set();

export function MedicineReminderWatcher() {
  const [medicines, setMedicines] = useState([]);
  useEffect(() => {
    const load = () => api.healthTracker.load().then(profile => setMedicines((profile.history || []).filter(item => item.category === "Medicine"))).catch(() => void 0);
    load();
    window.addEventListener("sanjeevani-reminders-changed", load);
    return () => window.removeEventListener("sanjeevani-reminders-changed", load);
  }, []);
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const check = () => {
      const date = localToday(), time = new Date().toTimeString().slice(0, 5);
      medicines.filter(item => item.reminder?.enabled && date >= item.reminder.startDate && (!item.reminder.endDate || date <= item.reminder.endDate) && item.reminder.times.includes(time)).forEach(item => {
        const key = `${idOf(item)}-${date}-${time}`;
        const taken = item.reminder.taken?.some(entry => entry.date === date && entry.time === time);
        if (!taken && !shown.has(key)) {
          shown.add(key);
          try { new Notification("Medicine Reminder", { body: `Time to take your recorded medicine: ${item.title}${item.formStrength ? ` ${item.formStrength}` : ""}`, tag: key }); } catch { /* Today's Medicines remains available without browser notification support. */ }
        }
      });
    };
    check();
    const timer = window.setInterval(check, 30000);
    return () => window.clearInterval(timer);
  }, [medicines]);
  return null;
}
