"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { GhostButton, ShellCard } from "@/components/fintech/ui";

type Props = { children: ReactNode; fallbackTitle?: string };
type State = { hasError: boolean };

export class FintechErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ShellCard className="mx-auto mt-8 max-w-lg">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-400" aria-hidden />
            <p className="text-lg font-semibold">{this.props.fallbackTitle ?? "Something went wrong"}</p>
            <p className="text-sm text-slate-400">Try refreshing the page. Your saved data should still be intact.</p>
            <GhostButton onClick={() => this.setState({ hasError: false })}>Try again</GhostButton>
          </div>
        </ShellCard>
      );
    }
    return this.props.children;
  }
}
