import React from "react";

export default function VersionBadge({
  version = process.env.REACT_APP_VERSION || "v0.1.0",
  variant = "pill",
  className = "",
}) {
  if (variant === "text") {
    return <span className={className}>{version}</span>;
  }
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border " +
        "border-black/10 bg-black/5 " +
        className
      }
      title="App version"
    >
      {version}
    </span>
  );
}
