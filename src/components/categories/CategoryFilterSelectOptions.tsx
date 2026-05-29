import { categoriesForSelect } from "@/lib/categories";
import type { Category, TransactionType } from "@/lib/types";

export function CategoryFilterSelectOptions({
  categories,
  filterType,
}: {
  categories: Category[];
  filterType: "all" | TransactionType;
}) {
  if (filterType === "all") {
    const expense = categoriesForSelect(categories, "expense");
    const income = categoriesForSelect(categories, "income");
    return (
      <>
        <FilterKindBlock label="Expense" {...expense} />
        <FilterKindBlock label="Income" {...income} />
      </>
    );
  }

  const { groups, standalone } = categoriesForSelect(categories, filterType);
  return (
    <>
      {groups.map((g) => (
        <option key={`grp-${g.parent.id}`} value={g.parent.id}>
          {g.parent.name} (all)
        </option>
      ))}
      {groups.map((g) => (
        <optgroup key={g.parent.id} label={g.parent.name}>
          {g.children.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </optgroup>
      ))}
      {standalone.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </>
  );
}

function FilterKindBlock({
  label,
  groups,
  standalone,
}: {
  label: string;
  groups: { parent: Category; children: Category[] }[];
  standalone: Category[];
}) {
  if (groups.length === 0 && standalone.length === 0) return null;
  return (
    <optgroup label={label}>
      {groups.map((g) => (
        <option key={`grp-${g.parent.id}`} value={g.parent.id}>
          {g.parent.name} (all)
        </option>
      ))}
      {groups.flatMap((g) =>
        g.children.map((c) => (
          <option key={c.id} value={c.id}>
            {g.parent.name} › {c.name}
          </option>
        ))
      )}
      {standalone.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </optgroup>
  );
}
