export const en = {
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    continue: "Continue",
    back: "Back",
    skip: "Skip step",
    loading: "Loading…",
    search: "Search",
    add: "Add",
    edit: "Edit",
    remove: "Remove",
    close: "Close",
    language: "Language",
    english: "English",
    spanish: "Spanish",
  },
  onboarding: {
    welcomeTitle: "Welcome — let's keep this calm",
    welcomeSubtitle: "Five short steps. Skip anything you want and finish later.",
    startSetup: "Start setup",
    walletsTitle: "Your wallets",
    walletsHint: "Remove suggestions you don't use, rename, or add your own.",
    categoriesTitle: "Budget categories",
    recurringTitle: "Recurring & paycheck",
    goalsTitle: "Savings goals (optional)",
    finishTitle: "You're set",
    finishDemo: "Load demo data & explore",
    finishEmpty: "Start with a clean slate",
    primaryCurrency: "Primary currency",
  },
  settings: {
    preferences: "Preferences",
    preferencesDesc: "Language, currency, date format, and appearance.",
    languageLabel: "Language",
    currencyLabel: "Primary currency",
    dateFormat: "Date format",
    weekStart: "Week starts on",
  },
  household: {
    title: "Household",
    create: "Create household",
    members: "Members",
    invite: "Invite by email",
    sendInvite: "Send invite",
    copyLink: "Copy invite link",
    activity: "Activity log",
    roleOwner: "Owner",
    roleEditor: "Editor",
    roleViewer: "Viewer",
    permissionsTitle: "Your permissions",
    joinTitle: "Join household",
    joinAccept: "Accept invitation",
    sharedBanner: "Shared household — changes sync with your family",
    viewerReadOnly: "View-only: you can browse but not edit",
  },
  transactions: {
    title: "Transactions",
    add: "Add transaction",
    deleteSelected: "Delete selected",
    empty: "No transactions match this filter",
    loadMore: "Load more",
  },
} as const;

type StringLeaf<T> = {
  [K in keyof T]: T[K] extends string ? string : never;
};

export type Messages = {
  common: StringLeaf<(typeof en)["common"]>;
  onboarding: StringLeaf<(typeof en)["onboarding"]>;
  settings: StringLeaf<(typeof en)["settings"]>;
  household: StringLeaf<(typeof en)["household"]>;
  transactions: StringLeaf<(typeof en)["transactions"]>;
};
