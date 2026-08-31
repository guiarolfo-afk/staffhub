import type { ReactNode } from "react";

export interface IconProps {
  size?: number;
  className?: string;
  sw?: number;
}

function make(nodes: ReactNode) {
  return function Icon({ size = 18, className, sw = 1.7 }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {nodes}
      </svg>
    );
  };
}

export const IGrid = make(
  <>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
  </>,
);

export const IUsers = make(
  <>
    <circle cx="9" cy="8" r="3.4" />
    <path d="M2.8 20c.7-3.2 3.2-5 6.2-5s5.5 1.8 6.2 5" />
    <path d="M16 5.2a3.4 3.4 0 0 1 0 5.6" />
    <path d="M18.4 15.4c1.6.8 2.6 2.3 2.9 4.6" />
  </>,
);

export const ICalendar = make(
  <>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 10h17M8 2.8V6M16 2.8V6" />
  </>,
);

export const IClock = make(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>,
);

export const IChat = make(
  <>
    <path d="M21 12.5a8 8 0 0 1-8 7.5 8.6 8.6 0 0 1-3.2-.6L4 21l1.6-5A8 8 0 1 1 21 12.5Z" />
    <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
  </>,
);

export const IChart = make(
  <>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <rect x="8" y="11" width="3" height="6" rx="0.8" />
    <rect x="14" y="7" width="3" height="10" rx="0.8" />
  </>,
);

export const IBell = make(
  <>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10 19a2.2 2.2 0 0 0 4 0" />
  </>,
);

export const ISearch = make(
  <>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.4-4.4" />
  </>,
);

export const IGlobe = make(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.6 2.3 3.9 5.2 3.9 8.5s-1.3 6.2-3.9 8.5c-2.6-2.3-3.9-5.2-3.9-8.5S9.4 5.8 12 3.5Z" />
  </>,
);

export const ILogout = make(
  <>
    <path d="M14 4H7a2.5 2.5 0 0 0-2.5 2.5v11A2.5 2.5 0 0 0 7 20h7" />
    <path d="m17 8 4 4-4 4M21 12H10" />
  </>,
);

export const IPlus = make(<path d="M12 5v14M5 12h14" />);

export const IX = make(<path d="M6 6l12 12M18 6L6 18" />);

export const IPencil = make(
  <>
    <path d="m14.5 5.5 4 4L8 20H4v-4L14.5 5.5Z" />
    <path d="m12.5 7.5 4 4" />
  </>,
);

export const ISend = make(
  <>
    <path d="M21 3 10.5 13.5" />
    <path d="M21 3 14 21l-3.5-7.5L3 10 21 3Z" />
  </>,
);

export const IPhone2 = make(
  <>
    <rect x="7" y="2.5" width="10" height="19" rx="2.8" />
    <path d="M10.5 18.5h3" />
  </>,
);

export const ITablet = make(
  <>
    <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
    <path d="M11 17.2h2" />
  </>,
);

export const IChevL = make(<path d="m14.5 6-6 6 6 6" />);
export const IChevR = make(<path d="m9.5 6 6 6-6 6" />);
export const IChevD = make(<path d="m6 9.5 6 6 6-6" />);

export const IAlert = make(
  <>
    <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" />
    <path d="M12 10v4M12 17h.01" />
  </>,
);

export const ICheck = make(<path d="m5 12.5 4.5 4.5L19 7.5" />);

export const IDownload = make(
  <>
    <path d="M12 4v11M7.5 11 12 15.5 16.5 11" />
    <path d="M4.5 19.5h15" />
  </>,
);

export const IStar = make(
  <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8L12 3.5Z" />,
);

export const IZap = make(<path d="M13 2.5 4.5 13.5H11l-1 8L19.5 10H13l1-7.5H13Z" />);

export const ICoffee = make(
  <>
    <path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
    <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M7 5.5c0-1 .8-1 .8-2M11 5.5c0-1 .8-1 .8-2" />
  </>,
);

export const IBuilding = make(
  <>
    <rect x="4.5" y="3.5" width="15" height="17" rx="1.5" />
    <path d="M9 20.5v-4h6v4M8.5 8h1.5M14 8h1.5M8.5 12h1.5M14 12h1.5" />
  </>,
);

export const IArrowR = make(<path d="M4 12h15M13 6l6 6-6 6" />);

export const IFingerprint = make(
  <>
    <path d="M12 11a2.5 2.5 0 0 0-2.5 2.5c0 2.5-.5 4.5-1.5 6" />
    <path d="M14.5 13.5c0 3-.5 5-1.5 7" />
    <path d="M17.5 13.5A5.5 5.5 0 0 0 8 9.5" />
    <path d="M6.5 13.5c0 1.5-.2 3-.7 4.3" />
    <path d="M19.5 9A8.5 8.5 0 0 0 5.5 7.5" />
  </>,
);

export const IWifi = make(
  <>
    <path d="M3 9.5a13.5 13.5 0 0 1 18 0" />
    <path d="M6.5 13a8.5 8.5 0 0 1 11 0" />
    <path d="M10 16.3a4 4 0 0 1 4 0" />
    <path d="M12 19.5h.01" />
  </>,
);

export const IBattery = make(
  <>
    <rect x="3" y="8" width="15" height="8" rx="2" />
    <path d="M21 11v2M5.5 10.5v3M8.5 10.5v3M11.5 10.5v3" />
  </>,
);

export const IFlame = make(
  <path d="M12 3c.5 3-1.5 4.5-2.8 6C7.7 10.8 7 12.3 7 14a5 5 0 0 0 10 0c0-1.6-.6-3-1.5-4.2-.3 1-.8 1.7-1.7 2.2.4-2.8-.4-6.5-1.8-9Z" />,
);

export const IHash = make(<path d="M9.5 4 7.5 20M16.5 4l-2 16M4.5 9h16M3.5 15h16" />);

export const IDesk = make(
  <>
    <path d="M3.5 10.5h17l-1.5 9h-14l-1.5-9Z" />
    <path d="M8 10.5 9.5 4.5h5L16 10.5M12 13.5v3" />
  </>,
);

export const ILayers = make(
  <>
    <path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" />
    <path d="m4.5 12.5 7.5 4 7.5-4M4.5 17l7.5 4 7.5-4" />
  </>,
);

export const IDot = make(<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />);

export const IUser = make(
  <>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" />
  </>,
);

export const IFolder = make(
  <path d="M3.5 6.5A1.8 1.8 0 0 1 5.3 4.7h4l2 2.4h7.4a1.8 1.8 0 0 1 1.8 1.8v8.6a1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8V6.5Z" />,
);

export const IFile = make(
  <>
    <path d="M6 3.5h8l4 4v13H6v-17Z" />
    <path d="M14 3.5v4h4" />
  </>,
);

export const IBanknote = make(
  <>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.8" />
    <path d="M6 9.5h.01M18 14.5h.01" />
  </>,
);

export const IReceipt = make(
  <>
    <path d="M6 3.5h12V20l-2.4-1.6L13.2 20l-2.4-1.6L8.4 20 6 18.4V3.5Z" />
    <path d="M9 8h6M9 11.5h6M9 15h3.5" />
  </>,
);

export const IClipboard = make(
  <>
    <rect x="5" y="4.5" width="14" height="16.5" rx="2" />
    <path d="M9 4.5V3.2A1.2 1.2 0 0 1 10.2 2h3.6A1.2 1.2 0 0 1 15 3.2v1.3M9 11h6M9 15h4" />
  </>,
);

export const IPlay = make(<path d="M8.5 5.5v13l10-6.5-10-6.5Z" />);

export const ISign = make(
  <>
    <path d="M13.5 3.5H6a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="m18.2 3.8 2 2L12 14l-2.7.7L10 12l8.2-8.2Z" />
  </>,
);

export const IShield = make(
  <>
    <path d="M12 3 5 5.8v5.4c0 4.6 3 8 7 9.8 4-1.8 7-5.2 7-9.8V5.8L12 3Z" />
    <path d="m9 11.5 2.2 2.2L15.5 9.5" />
  </>,
);

export const IStore = make(
  <>
    <path d="M4 8.5 5.5 4h13L20 8.5" />
    <path d="M4 8.5a2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.3 0" />
    <path d="M5 11v9h14v-9M10 20v-5.5h4V20" />
  </>,
);

export const IHeart = make(
  <path d="M12 20.5S4 15.5 4 9.8A4.3 4.3 0 0 1 8.3 5.5c1.6 0 3 .9 3.7 2.2.7-1.3 2.1-2.2 3.7-2.2A4.3 4.3 0 0 1 20 9.8c0 5.7-8 10.7-8 10.7Z" />,
);

export const IEye = make(
  <>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </>,
);

export const IScan = make(
  <>
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M3 12h18" />
  </>,
);

export const ILock = make(
  <>
    <rect x="5.5" y="10.5" width="13" height="10" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.5v2.5" />
  </>,
);
