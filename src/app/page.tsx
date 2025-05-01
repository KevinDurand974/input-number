"use client";

import InputNumber from "@/components/InputNumber";
import { useState } from "react";
import styles from "./page.module.css";

const step = 10;

const types = ["horizontal", "vertical"] as const;

const differentTypes = [
  {},
  { notation: "compact" },
  { notation: "engineering" },
  { notation: "scientific" },
  { format: "percent" },
  { format: "currency", currency: "EUR" },
  { format: "unit", unit: "meter", display: "long" },
  { format: "unit", unit: "meter", display: "narrow" },
  { format: "unit", unit: "meter", display: "short" },
  { format: "custom", parser: (value: number) => `${value} px` },
  { format: "custom", parser: (value: number) => `${value} m²` },
  { format: "custom", parser: (value: number) => `n°${value}` },
  { format: "custom", parser: (value: number) => `${value} 🎂` },
] as const;

export default function Home() {
  const [meterValue, setMeterValue] = useState(123456);

  return (
    <div className={styles.page}>
      <main style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {types.map((type) => (
          <section
            key={type}
            style={{ width: "200px", display: "flex", flexDirection: "column", gap: 5 }}
          >
            {differentTypes.map((props, index) => (
              <InputNumber
                key={index}
                {...props}
                step={step}
                min={0}
                type={type}
                value={meterValue}
                onChange={(details) => setMeterValue(details.value)}
              />
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
