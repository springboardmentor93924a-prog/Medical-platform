function Logo({ size = 180, className = '' }) {
  return (
    <img
      src="/images/medistock_logo.png"
      alt="MediStock - Clinical Inventory"
      style={{ width: size, height: "auto" }}
      className={`object-contain drop-shadow-sm transition-transform hover:scale-[1.02] ${className}`}
    />
  );
}

export default Logo;
