import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { FintechThemeProvider } from "@/components/fintech/theme";
import { ConfirmDialogProvider, useConfirm } from "@/components/providers/confirm-dialog-provider";

function TestProviders({ children }: { children: ReactNode }) {
  return (
    <FintechThemeProvider>
      <div id="modal-root" />
      <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
    </FintechThemeProvider>
  );
}

function TestHarness({ onResult }: { onResult: (ok: boolean) => void }) {
  const confirm = useConfirm();
  return (
    <button
      type="button"
      onClick={() => {
        void confirm({
          title: "Delete item?",
          description: "This cannot be undone.",
          confirmLabel: "Delete",
          onConfirm: () => {},
        }).then(onResult);
      }}
    >
      Open confirm
    </button>
  );
}

describe("ConfirmDialogProvider", () => {
  afterEach(() => {
    cleanup();
  });

  it("resolves true when user confirms", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <TestProviders>
        <TestHarness onResult={onResult} />
      </TestProviders>
    );

    await user.click(screen.getByRole("button", { name: /open confirm/i }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
  });

  it("resolves false when user cancels", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <TestProviders>
        <TestHarness onResult={onResult} />
      </TestProviders>
    );

    await user.click(screen.getByRole("button", { name: /open confirm/i }));
    await user.click(await screen.findByRole("button", { name: /cancel/i }));

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false));
  });
});
