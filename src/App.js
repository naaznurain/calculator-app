import React, { useState, useEffect, useCallback } from "react";
import Button from "./components/Button";
import ToggleButton from "./components/ToggleButton";
import "./App.css";

/* Helper utils */
const isOperator = (ch) => ["+", "-", "*", "/", ".", "%"].includes(ch);
const lastCharIsOperator = (s) => s.length === 0 ? false : isOperator(s[s.length - 1]);

/* safeEvaluate: minimal sanitizer then evaluate using Function constructor */
function safeEvaluate(expr) {
  // Replace '^' with ** for exponent
  const normalized = expr.replace(/π/g, String(Math.PI)).replace(/\^/g, "**");

  // Basic blacklist (disallow letters except allowed Math tokens)
  // allow digits, whitespace, parentheses, + - * / . % and **
  if (/[^0-9+\-*/().%* \t\n\r]/.test(normalized)) {
    // If there are letters, we only permit them if they are part of 'Math' but we don't support that here.
    throw new Error("Invalid characters");
  }

  // evaluate
  // Using Function instead of eval (slightly safer, still be cautious)
  // Surround in parentheses to allow expressions like "2+3"
  const fn = new Function(`"use strict"; return (${normalized});`);
  return fn();
}

export default function App() {
  const [input, setInput] = useState("");
  const [dark, setDark] = useState(true);

  const toggleTheme = () => setDark((d) => !d);

  const pushValue = (val) => {
    // If currently in Error state and user presses number or '.' start fresh
    if (input === "Error" && /[0-9.]/.test(val)) {
      setInput(val);
      return;
    }

    // Prevent two operators in a row
    if (isOperator(val)) {
      if (input === "" && val !== "-") return; // only allow leading minus
      if (lastCharIsOperator(input)) {
        // replace last operator with new (except percent handling)
        setInput((prev) => prev.slice(0, -1) + val);
        return;
      }
    }

    setInput((prev) => prev + val);
  };

  const applyUnary = (fnName) => {
    if (!input) return;
    try {
      const val = safeEvaluate(input);
      let out;
      switch (fnName) {
        case "sin":
          out = Math.sin(val);
          break;
        case "cos":
          out = Math.cos(val);
          break;
        case "tan":
          out = Math.tan(val);
          break;
        case "log":
          out = Math.log10(val);
          break;
        case "√":
          out = Math.sqrt(val);
          break;
        case "%":
          out = val / 100;
          break;
        default:
          return;
      }
      setInput(String(Number(out.toPrecision(12))));
    } catch (e) {
      setInput("Error");
    }
  };

  const handleClick = useCallback(
    (value) => {
      if (value === "=") {
        if (!input) return;
        try {
          // quick check divide by zero: naive but helps
          if (/\/\s*0(?:\.|$)/.test(input)) {
            setInput("Error");
            return;
          }
          const result = safeEvaluate(input);
          setInput(String(Number(result.toPrecision(12))));
        } catch (e) {
          setInput("Error");
        }
        return;
      }

      if (value === "C") {
        setInput("");
        return;
      }

      if (value === "DEL") {
        if (input === "Error") {
          setInput("");
        } else {
          setInput((prev) => prev.slice(0, -1));
        }
        return;
      }

      // scientific / unary shortcuts
      if (["sin", "cos", "tan", "log", "√", "%"].includes(value)) {
        if (value === "%") {
          // percent acting on current value
          applyUnary("%");
        } else {
          applyUnary(value);
        }
        return;
      }

      if (value === "π") {
        // append pi numeric value
        pushValue(String(Math.PI));
        return;
      }

      if (value === "^") {
        // append ^ will be replaced by ** in evaluator
        pushValue("^");
        return;
      }

      // default path (numbers, operators, dot)
      pushValue(value);
    },
    [input]
  );

  // Keyboard support: register once
  useEffect(() => {
    const handleKey = (e) => {
      const key = e.key;

      // numbers and basic operators
      if ((/^[0-9]$/).test(key)) {
        pushValue(key);
        return;
      }

      if (key === ".") {
        pushValue(".");
        return;
      }

      if (key === "+") { pushValue("+"); return; }
      if (key === "-") { pushValue("-"); return; }
      if (key === "*") { pushValue("*"); return; }
      if (key === "/") { pushValue("/"); return; }
      if (key === "%") { handleClick("%"); return; }
      if (key === "^") { handleClick("^"); return; }

      if (key === "Enter") {
        e.preventDefault();
        handleClick("=");
        return;
      }

      if (key === "Backspace") {
        handleClick("DEL");
        return;
      }

      if (key === "Escape") {
        handleClick("C");
        return;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // intentionally empty deps so listener registers once
  }, [handleClick]);

  // button layout
  const sciButtons = ["sin", "cos", "tan", "√", "log", "π", "^", "%"];
  const mainButtons = [
    "7", "8", "9", "/", "DEL",
    "4", "5", "6", "*", "C",
    "1", "2", "3", "-", "=",
    "0", ".", "+"
  ];

  return (
    <div className={`app ${dark ? "dark" : "light"}`}>
      <div className="calculator">
        <ToggleButton dark={dark} toggle={toggleTheme} />
        <h2>Advanced React Calculator</h2>

        <input
          className="display"
          type="text"
          value={input}
          readOnly
          aria-label="calculator display"
        />

        <div className="sci-buttons">
          {sciButtons.map((btn, i) => (
            <Button key={i} value={btn} onClick={handleClick} className="btn sci" />
          ))}
        </div>

        <div className="buttons">
          {mainButtons.map((btn, i) => (
            <Button
              key={i}
              value={btn}
              onClick={handleClick}
              className={`btn ${btn === "C" ? "clear" : ""} ${btn === "DEL" ? "del" : ""} ${btn === "=" ? "equal" : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
