import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import styles from "./Container.module.css";

export type ContainerProps = ComponentPropsWithoutRef<"div">;

/** Centers content at the original 1320px maximum width with responsive side padding. */
export function Container({ className, ...rest }: ContainerProps) {
  return <div {...rest} className={cn(styles.container, className)} />;
}
