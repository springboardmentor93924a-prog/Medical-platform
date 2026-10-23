const paths = {
  dashboard: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M14 14h7v7h-7z", "M3 14h7v7H3z"],
  users: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M22 21v-2a4 4 0 0 0-3-3.87",
    "M16 3.13a4 4 0 0 1 0 7.75",
  ],
  pill: [
    "M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7z",
    "M8.5 8.5l7 7",
  ],
  truck: [
    "M14 18V6a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1",
    "M14 9h4l4 4v4a1 1 0 0 1-1 1h-1",
    "M6 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0z",
    "M15 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0z",
  ],
  boxes: [
    "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
    "M3.3 7 12 12l8.7-5",
    "M12 22V12",
  ],
  cart: [
    "M2 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L21 7H6",
    "M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    "M18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  ],
  swap: ["M17 3l4 4-4 4", "M21 7H7", "M7 21l-4-4 4-4", "M3 17h14"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7v5l3 2"],
  file: [
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
    "M14 2v6h6",
    "M8 13h8",
    "M8 17h5",
  ],
  bell: [
    "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9",
    "M13.7 21a2 2 0 0 1-3.4 0",
  ],
  shield: [
    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    "M9 12l2 2 4-4",
  ],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  close: ["M6 6l12 12", "M18 6L6 18"],
  sun: [
    "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
    "M12 1v2",
    "M12 21v2",
    "M4.2 4.2l1.4 1.4",
    "M18.4 18.4l1.4 1.4",
    "M1 12h2",
    "M21 12h2",
    "M4.2 19.8l1.4-1.4",
    "M18.4 5.6l1.4-1.4",
  ],
  moon: ["M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.3-4.3"],
  cross: ["M12 7v10", "M7 12h10"],
  check: ["M20 6L9 17l-5-5"],
  arrow: ["M5 12h14", "M13 6l6 6-6 6"],
};

export function Icon({ name, className = "h-5 w-5", strokeWidth = 1.8 }) {
  const shape = paths[name] || paths.dashboard;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {shape.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
