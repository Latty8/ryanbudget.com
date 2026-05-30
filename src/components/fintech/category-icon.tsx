"use client";

import {
  Building2,
  Bus,
  Car,
  CircleDollarSign,
  Coffee,
  CreditCard,
  Droplets,
  Dumbbell,
  Fuel,
  Gamepad2,
  GraduationCap,
  Heart,
  Home,
  Landmark,
  Music,
  PawPrint,
  PiggyBank,
  Plane,
  Repeat,
  Shield,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Tv,
  User,
  Utensils,
  Wallet,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Building2,
  Zap,
  Droplets,
  Wifi,
  Smartphone,
  ShoppingCart,
  Utensils,
  Coffee,
  Car,
  Fuel,
  Bus,
  Shield,
  Wrench,
  Repeat,
  Tv,
  Gamepad2,
  ShoppingBag,
  User,
  Heart,
  Dumbbell,
  PawPrint,
  PiggyBank,
  ShieldCheck,
  Plane,
  Landmark,
  CreditCard,
  GraduationCap,
  CircleDollarSign,
  Sparkles,
  Wallet,
  Music,
};

export function resolveCategoryIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? CircleDollarSign;
}

export function CategoryIconBadge({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: string;
  size?: "sm" | "md";
}) {
  const Icon = resolveCategoryIcon(name);
  const dim = size === "sm" ? "h-7 w-7 rounded-lg" : "h-9 w-9 rounded-xl";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${dim}`}
      style={{ backgroundColor: `${color}22`, color }}
    >
      <Icon className={iconSize} aria-hidden />
    </span>
  );
}
