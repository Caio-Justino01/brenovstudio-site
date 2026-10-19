import { services, type ServiceId } from '../config/site.ts';

export type Briefing = {
  name: string;
  services: ServiceId[];
  date: string;
  place: string;
  idea: string;
};

export function buildBriefing(data: Briefing) {
  const date = data.date ? data.date.split('-').reverse().join('/') : 'A definir';
  const selected = data.services.map(id => services.find(service => service.id === id)?.label).filter(Boolean).join(', ');
  return `Olá, Breno! Quero conversar sobre um projeto.\n\nNome: ${data.name.trim()}\nServiços: ${selected}\nData: ${date}\nLocal: ${data.place.trim() || 'A definir'}\n\nIdeia:\n${data.idea.trim()}`;
}

export function whatsappLink(number: string | null, message: string): string | null {
  if (!number) return null;
  const digits = number.replace(/\D/g, '');
  if (!/^\d{10,15}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
