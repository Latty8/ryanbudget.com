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
import { cn } from "@/lib/utils";

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
  size?: "sm" | "md" | "lg";
}) {
  const Icon = resolveCategoryIcon(name);
  const dim =
    size === "sm"
      ? "h-8 w-8 rounded-xl"
      : size === "lg"
        ? "h-14 w-14 rounded-2xl"
        : "h-10 w-10 rounded-xl";
  const iconSize =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-[1.125rem] w-[1.125rem]";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center shadow-sm ring-1 ring-black/5 dark:ring-white/10",
        dim
      )}
      style={{
        backgroundColor: `${color}18`,
        color,
        boxShadow: size === "lg" ? `0 12px 28px -8px ${color}55` : undefined,
      }}
    >
      <Icon className={iconSize} aria-hidden />
    </span>
  );
}
