"use client";

// https://v8.dev/features/intl-numberformat

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./style.scss";

const MINUS_SVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
  >
    <path
      fill="currentColor"
      d="M19 12.998H5v-2h14z"
    />
  </svg>
);
const PLUS_SVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
  >
    <path
      fill="currentColor"
      d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"
    />
  </svg>
);
const DOWN_ARROW_SVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
  >
    <path
      fill="currentColor"
      d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6l-6-6z"
    />
  </svg>
);
const UP_ARROW_SVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
  >
    <path
      fill="currentColor"
      d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6l-6 6z"
    />
  </svg>
);

type OnChange = (details: { value: number; textValue: string }) => void;

type BaseInputNumberProps = {
  max?: number;
  min?: number;
  step?: number;
  placeholder?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: "standard" | "scientific" | "engineering" | "compact";
  type?: "horizontal" | "vertical";
  value?: number;
  onChange?: OnChange;
};

type UnitProps = { format: "unit"; unit: string; display?: "long" | "short" | "narrow"; lang?: string };

type CurrencyProps = {
  format: "currency";
  currency: string;
  display?: "symbol" | "narrowSymbol" | "code" | "name";
  sign?: "auto" | "never" | "always" | "exceptZero";
  lang?: string;
};

type PercentProps = { format: "percent"; lang?: string };

type DecimalProps = { format?: "decimal"; lang?: string };

type CustomProps = { format: "custom"; parser: (value: number) => string };

// A debounce effect is used to prevent the input from being updated too often
const useDebounceEffect = (callback: () => void, deps: any[], delay: number = 2) => {
  useEffect(() => {
    const timer = setTimeout(callback, delay);
    return () => clearTimeout(timer);
  }, deps);
};

type InputNumberProps = BaseInputNumberProps & (UnitProps | CurrencyProps | PercentProps | DecimalProps | CustomProps);

/**
 * A customizable number input component that supports various formatting options.
 *
 * @param {Object} props - Component props
 * @param {number} [props.value] - The current value of the input
 * @param {Function} [props.onChange] - Callback when value changes
 * @param {string} [props.format] - Format type: "decimal", "currency", "unit", "percent", or "custom"
 * @param {number} [props.min] - Minimum allowed value (default: -Infinity)
 * @param {number} [props.max] - Maximum allowed value (default: Infinity)
 * @param {number} [props.step] - Step value for increment/decrement (default: 1)
 * @param {string} [props.placeholder] - Placeholder text when value is empty
 * @param {number} [props.minimumFractionDigits] - Minimum number of decimal places
 * @param {number} [props.maximumFractionDigits] - Maximum number of decimal places
 * @param {"standard" | "scientific" | "engineering" | "compact"} [props.notation] - Number notation style
 * @param {"horizontal" | "vertical"} [props.type] - Layout type (default: "horizontal")
 * @param {string} [props.currency] - Currency code (required when format="currency")
 * @param {string} [props.unit] - Unit type (required when format="unit")
 * @param {string} [props.lang] - Language code for formatting
 * @param {Function} [props.parser] - Custom parser function (required when format="custom")
 * @param {"symbol" | "narrowSymbol" | "code" | "name"} [props.display] - Display style for currency
 * @param {"auto" | "never" | "always" | "exceptZero"} [props.sign] - Sign display for currency
 *
 * @example
 * // No props
 * <InputNumber />
 *
 * @example
 * // Basic decimal input
 * <InputNumber
 *   value={state}
 *   onChange={(details) => setState(details.value)}
 * />
 *
 * @example
 * // Currency input (Euros)
 * <InputNumber
 *   format="currency"
 *   currency="EUR"
 *   value={state}
 *   onChange={(details) => setState(details.value)}
 * />
 *
 * @example
 * // Unit input (Kilometers)
 * <InputNumber
 *   format="unit"
 *   unit="kilometer"
 *   value={state}
 *   onChange={(details) => setState(details.value)}
 * />
 *
 * @example
 * // Percentage input
 * <InputNumber
 *   format="percent"
 *   value={state}
 *   onChange={(details) => setState(details.value)}
 * />
 *
 * @example
 * // Custom format with parser
 * <InputNumber
 *   format="custom"
 *   parser={(details.value) => `Custom: ${value}`}
 *   value={state}
 *   onChange={(details) => setState(details.value)}
 * />
 *
 * @example
 * // Vertical layout with step and limits
 * <InputNumber
 *   type="vertical"
 *   min={0}
 *   max={100}
 *   step={0.1}
 *   value={state}
 *   onChange={(details) => setState(details.value)}
 * />
 */
const InputNumber = (props: InputNumberProps) => {
  const { decimalNumber } = useMemo(() => {
    const decimalNumber = props.step?.toString().split(".")[1]?.length || 0;
    return { decimalNumber };
  }, [props]);

  const defaultProps = useMemo(
    () => ({
      ...props,
      max: props.max ?? Infinity,
      min: props.min ?? -Infinity,
      step: props.step ?? 1,
      placeholder: props.placeholder || "0",
      format: props.format || "decimal",
      minimumFractionDigits: Math.max(props.minimumFractionDigits ?? 0, props.format === "currency" ? 2 : 0),
      maximumFractionDigits: Math.max(
        props.minimumFractionDigits ?? 0,
        props.maximumFractionDigits ?? 0,
        props.format === "percent" ? 2 : Math.max(decimalNumber, 10)
      ),
      type: props.type || "horizontal",
      notation: props.notation || "standard",
    }),
    [props, decimalNumber]
  );

  const parseValue = useCallback(
    (oldInputValue: number | string, change = 0) => {
      if (oldInputValue === "") return "";
      if (+oldInputValue + change <= defaultProps.min) return defaultProps.min;
      if (+oldInputValue + change >= defaultProps.max) return defaultProps.max;
      const newValue = +oldInputValue + change;
      const nvLength = newValue.toString().split(".")[1]?.length || 0;
      const oiLength = oldInputValue.toString().split(".")[1]?.length || 0;
      const cLength = change.toString().split(".")[1]?.length || 0;
      const bothLength = defaultProps.format === "percent" ? 2 : Math.max(oiLength, cLength);
      if (nvLength > bothLength) {
        return Math.round(newValue * 10 ** bothLength) / 10 ** bothLength;
      }
      return newValue;
    },
    [defaultProps]
  );

  const parseTextValue = useCallback(
    (newValue: number | "") => {
      if (newValue !== "" && defaultProps.format === "percent") {
        const currentProps = defaultProps as BaseInputNumberProps & PercentProps;
        return Intl.NumberFormat(currentProps.lang || "fr-FR", {
          style: "percent",
          minimumFractionDigits: defaultProps.minimumFractionDigits,
          maximumFractionDigits: defaultProps.maximumFractionDigits,
          notation: defaultProps.notation,
        }).format(newValue / 100);
      }
      if (newValue !== "" && defaultProps.format === "unit") {
        const currentProps = defaultProps as BaseInputNumberProps & UnitProps;
        return Intl.NumberFormat(currentProps.lang || "fr-FR", {
          style: "unit",
          unit: currentProps.unit,
          minimumFractionDigits: currentProps.minimumFractionDigits,
          maximumFractionDigits: currentProps.maximumFractionDigits,
          notation: currentProps.notation,
          unitDisplay: currentProps.display || "short",
        }).format(newValue);
      }
      if (newValue !== "" && defaultProps.format === "currency") {
        const currentProps = defaultProps as BaseInputNumberProps & CurrencyProps;
        return Intl.NumberFormat(currentProps.lang || "fr-FR", {
          style: "currency",
          currency: currentProps.currency,
          minimumFractionDigits: currentProps.minimumFractionDigits,
          maximumFractionDigits: currentProps.maximumFractionDigits,
          notation: currentProps.notation,
          currencyDisplay: currentProps.display || "symbol",
          signDisplay: currentProps.sign || "auto",
        }).format(newValue);
      }
      if (newValue !== "" && defaultProps.format === "decimal") {
        const currentProps = defaultProps as BaseInputNumberProps & DecimalProps;
        return Intl.NumberFormat(currentProps.lang || "fr-FR", {
          style: "decimal",
          minimumFractionDigits: currentProps.minimumFractionDigits,
          maximumFractionDigits: currentProps.maximumFractionDigits,
          notation: currentProps.notation,
        }).format(newValue);
      }
      if (newValue !== "" && defaultProps.format === "custom") {
        const currentProps = defaultProps as BaseInputNumberProps & CustomProps;
        return currentProps.parser(newValue);
      }
      return String(newValue);
    },
    [decimalNumber, defaultProps]
  );

  const animationRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [inputState, setInputState] = useState<{ value: number | ""; textValue: string }>({
    value: props.value ?? 0,
    textValue: parseTextValue(props.value ?? 0),
  });

  useDebounceEffect(() => {
    props.onChange?.({ value: inputState.value || 0, textValue: inputState.textValue });
  }, [inputState]);

  useEffect(() => {
    setInputState(() => {
      const newData = { value: props.value ?? "", textValue: parseTextValue(props.value ?? "") } as const;
      return newData;
    });
  }, [props.value]);

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setInputState({ value: "", textValue: "" });
    } else {
      const parsedValue = parseValue(value);
      const textValue = parseTextValue(parsedValue);
      setInputState({ value: parsedValue, textValue });
    }
  };

  const handleOnBlur = () => {
    setInputState((old) => {
      const newValue = parseValue(old.value);
      const textValue = parseTextValue(newValue);
      return { value: newValue, textValue };
    });
  };

  const handleDecrement = () => {
    setInputState((old) => {
      const newValue = old.value === "" ? parseValue(0, -defaultProps.step) : parseValue(old.value, -defaultProps.step);
      const textValue = parseTextValue(newValue);
      return { value: newValue, textValue };
    });
  };

  const handleIncrement = () => {
    setInputState((old) => {
      const newValue = old.value === "" ? parseValue(0, defaultProps.step) : parseValue(old.value, defaultProps.step);
      const textValue = parseTextValue(newValue);
      return { value: newValue, textValue };
    });
  };

  const handleOnLongPress = (action: () => void) => {
    action();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      let lastTime = performance.now();
      const animate = (currentTime: number) => {
        if (currentTime - lastTime >= 100) {
          action();
          lastTime = currentTime;
        }
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    }, 400);
  };

  const handleClearInterval = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  if (defaultProps.type === "horizontal") {
    return (
      <div className="InputNumber InputNumber--horizontal">
        <button
          tabIndex={-1}
          type="button"
          className="InputNumber__trigger"
          onMouseDown={() => handleOnLongPress(handleDecrement)}
          onMouseUp={handleClearInterval}
          onMouseLeave={handleClearInterval}
          disabled={+inputState.value <= defaultProps.min}
        >
          <MINUS_SVG />
        </button>
        <div className="InputNumber__input-wrapper">
          <input
            type="number"
            className="InputNumber__input-number"
            min={defaultProps.min}
            max={defaultProps.max}
            step={defaultProps.step}
            value={inputState.value}
            onChange={handleOnChange}
            onBlur={handleOnBlur}
          />
          <div className="InputNumber__input-text">{inputState.textValue}</div>
          {!inputState.value && !inputState.textValue && (
            <div className="InputNumber__input-placeholder">{defaultProps.placeholder}</div>
          )}
        </div>
        <button
          tabIndex={-1}
          type="button"
          className="InputNumber__trigger"
          onMouseDown={() => handleOnLongPress(handleIncrement)}
          onMouseUp={handleClearInterval}
          onMouseLeave={handleClearInterval}
          disabled={+inputState.value >= defaultProps.max}
        >
          <PLUS_SVG />
        </button>
      </div>
    );
  }

  return (
    <div className="InputNumber InputNumber--vertical">
      <div className="InputNumber__input-wrapper">
        <input
          type="number"
          className="InputNumber__input-number"
          min={defaultProps.min}
          max={defaultProps.max}
          step={defaultProps.step}
          value={inputState.value}
          onChange={handleOnChange}
          onBlur={handleOnBlur}
        />
        <div className="InputNumber__input-text">{inputState.textValue}</div>
        {!inputState.value && !inputState.textValue && (
          <div className="InputNumber__input-placeholder">{defaultProps.placeholder}</div>
        )}
      </div>
      <div className="InputNumber__triggers">
        <button
          tabIndex={-1}
          type="button"
          className="InputNumber__trigger"
          onMouseDown={() => handleOnLongPress(handleIncrement)}
          onMouseUp={handleClearInterval}
          onMouseLeave={handleClearInterval}
          disabled={+inputState.value >= defaultProps.max}
        >
          <UP_ARROW_SVG />
        </button>
        <div className="InputNumber__trigger_separator"></div>
        <button
          tabIndex={-1}
          type="button"
          className="InputNumber__trigger"
          onMouseDown={() => handleOnLongPress(handleDecrement)}
          onMouseUp={handleClearInterval}
          onMouseLeave={handleClearInterval}
          disabled={+inputState.value <= defaultProps.min}
        >
          <DOWN_ARROW_SVG />
        </button>
      </div>
    </div>
  );
};

export default InputNumber;
