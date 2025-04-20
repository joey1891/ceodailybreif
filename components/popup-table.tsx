import { TableCell } from "@/components/ui/table";

// ... existing code ...

interface PopupTableItem {
  id: string | number;
  position?: number | null;
  // Add other properties as needed
}

export function PopupTable({ items }: { items: PopupTableItem[] }) {
  return (
    <table>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            {/* Other cells */}
            <TableCell>
              {typeof item.position === 'undefined' || item.position === null
                ? '0px'
                : `${item.position}px`}
            </TableCell>
            {/* Other cells */}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ... existing code ...
