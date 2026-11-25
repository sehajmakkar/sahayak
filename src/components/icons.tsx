import {
  Accessibility,
  Briefcase,
  Flame,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  Landmark,
  PiggyBank,
  ShieldCheck,
  Users,
  Utensils,
  Wheat,
  Wrench,
  Building2,
  Globe,
  Hospital,
  Mail,
  Monitor,
  School,
  type LucideIcon,
} from "lucide-react";
import type { Category, Channel } from "@/lib/core/types";

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  farming: Wheat,
  health: HeartPulse,
  pension: HandCoins,
  insurance: ShieldCheck,
  housing: House,
  education: GraduationCap,
  jobs: Wrench,
  business: Briefcase,
  women_child: Users,
  food: Utensils,
  disability: Accessibility,
  utilities: Flame,
  banking: PiggyBank,
};

export const CHANNEL_ICON: Record<Channel, LucideIcon> = {
  online: Globe,
  csc: Monitor,
  bank: Landmark,
  post_office: Mail,
  gram_panchayat: Building2,
  anganwadi: Users,
  health_centre: Hospital,
  school_college: School,
  district_office: Building2,
};

export function CategoryIcon({ category, size = 20 }: { category: Category; size?: number }) {
  const Icon = CATEGORY_ICON[category];
  return <Icon size={size} strokeWidth={1.8} aria-hidden />;
}

/** Yojana Setu logo: a bridge (setu) under a rising sun. Same artwork as public/icon.svg. */
export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden focusable="false">
      <defs>
        <linearGradient id="ys-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1747a6" />
          <stop offset="1" stopColor="#0d7c8c" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#ys-mark)" />
      <circle cx="256" cy="150" r="36" fill="#f5a524" />
      <path d="M104 338 Q256 118 408 338" fill="none" stroke="#fff" strokeWidth="38" strokeLinecap="round" />
      <path d="M178 266v56M256 240v82M334 266v56" stroke="#fff" strokeWidth="22" strokeLinecap="round" />
      <rect x="72" y="318" width="368" height="40" rx="20" fill="#fff" />
      <path d="M128 412q32-18 64 0t64 0 64 0 64 0" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="18" strokeLinecap="round" />
    </svg>
  );
}
