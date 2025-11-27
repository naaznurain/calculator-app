import React from "react";

const ToggleButton = ({ dark, toggle }) => {
  return (
    <button className="toggle-btn" onClick={toggle}>
      {dark ? "🌙 Dark Mode" : "☀ Light Mode"}
    </button>
  );
};

export default ToggleButton;
