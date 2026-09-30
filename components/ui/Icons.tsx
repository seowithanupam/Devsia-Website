import type { ReactNode, SVGProps } from "react";

/**
 * Small inline icons. Decorative by default (aria-hidden); give the parent an accessible name.
 * Shapes are simple stand-ins: the original's exact icon artwork was not recoverable.
 */
type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number };

function Svg({ size = 18, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

const stroke = { stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function HeartIcon({ filled = false, size = 18, ...rest }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={filled ? "currentColor" : "none"} {...rest}>
      <path
        d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.9 3.5 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.5 0 5.4 3.4 4.2 6.7-1.7 4.7-9.2 9.3-9.2 9.3Z"
        {...stroke}
      />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M5 4h3.2l1.6 4-2 1.3a11 11 0 0 0 5.9 5.9l1.3-2 4 1.6V18a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z"
        {...stroke}
      />
    </Svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20l1.2-4.2A8 8 0 1 1 8.4 19L4 20Z" {...stroke} />
      <path d="M9 9c.3 2.6 2.4 4.7 5 5l1.2-1.3-2-1-.9.7a3.6 3.6 0 0 1-1.7-1.7l.7-.9-1-2L9 9Z" {...stroke} />
    </Svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" {...stroke} />
      <path d="m3.5 7 8.5 6 8.5-6" {...stroke} />
    </Svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21s6.5-5.4 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.6 6.5 11 6.5 11Z" {...stroke} />
      <circle cx="12" cy="10" r="2.4" {...stroke} />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" {...stroke} />
      <path d="m16 16 4.5 4.5" {...stroke} />
    </Svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" {...stroke} />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 6 12 12M18 6 6 18" {...stroke} />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12.5 4.2 4.2L19 7" {...stroke} />
    </Svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14m-5-5 5 5-5 5" {...stroke} />
    </Svg>
  );
}
