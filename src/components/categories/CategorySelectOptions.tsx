import { categoriesForSelect } from "@/lib/categories";
import type { Category, CategoryKind } from "@/lib/types";

export function CategorySelectOptions({
  categories,
  kind,
}: {
  categories: Category[];
  kind: CategoryKind;
}) {
  const { groups, standalone } = categoriesForSelect(categories, kind);

  return (
    <>
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
