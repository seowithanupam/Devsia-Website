import type { Property } from "@/lib/services/types";
import { PropertyCard } from "./PropertyCard";
import styles from "./property.module.css";

export function PropertyGrid({ items, whatsappBase }: { items: Property[]; whatsappBase?: string }) {
  return (
    <ul className={styles.grid}>
      {items.map((property, index) => (
        <li key={property.id}>
          <PropertyCard property={property} priority={index < 3} whatsappBase={whatsappBase} />
        </li>
      ))}
    </ul>
  );
}
