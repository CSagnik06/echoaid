import { ArrowLeft } from 'lucide-react';

export function BackButton({ onBack }) {
  return <button className="app-back-button" onClick={onBack}><ArrowLeft size={16} />Back</button>;
}
