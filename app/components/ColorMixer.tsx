import React, { useEffect, useState } from "react";
import { findColorMix, hexToCmyk, cmykToHex } from "~/utils/colorMixing";

const ColorMixer: React.FC = () => {
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [targetColor, setTargetColor] = useState<string>("#000000");
  const [result, setResult] = useState<{
    color: string;
    percentages: number[];
    distance: number;
  } | null>(null);
  const [useCmyk, setUseCmyk] = useState<boolean>(false);

  const addAvailableColor = (color: string) => {
    setAvailableColors([...availableColors, color]);
  };

  const formatColor = (color: string) => {
    if (useCmyk) {
      const [c, m, y, k] = hexToCmyk(color);
      return `C: ${c.toFixed(2)}%, M: ${m.toFixed(2)}%, Y: ${y.toFixed(
        2
      )}%, K: ${k.toFixed(2)}%`;
    }
    return color;
  };

  useEffect(() => {
    const mixResult = findColorMix(availableColors, targetColor, useCmyk);
    setResult(mixResult);
  }, [availableColors, targetColor, useCmyk]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-4 w-[400px]">
      <div>
        <label>
          <input
            type="checkbox"
            checked={useCmyk}
            onChange={(e) => setUseCmyk(e.target.checked)}
          />
          Use CMYK
        </label>
      </div>
      <div>
        <h3>Target Color</h3>
        <input
          type="color"
          value={targetColor}
          onChange={(e) => setTargetColor(e.target.value)}
        />
        <ColorBlock color={targetColor} label={formatColor(targetColor)} />
      </div>
      <div>
        <h3>Available Colors</h3>
        <input
          type="color"
          onBlur={(e) => addAvailableColor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
        />
        <div className="flex flex-wrap gap-1">
          {availableColors.map((color, index) => (
            <ColorBlock
              key={index}
              color={color}
              label={formatColor(color)}
              onRemove={() => setAvailableColors(availableColors.filter((_, i) => i !== index))}
              isRemovable={true}
            />
          ))}
        </div>
      </div>
      {result && (
        <div>
          <h3>Result</h3>
          <ColorBlock
            color={result.color}
            label={`${formatColor(result.color)} (${result.distance.toFixed(
              2
            )})`}
          />
          <div className="flex flex-col gap-2">
            {result.percentages.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={p}
                  readOnly
                  className="flex-grow"
                />
                <span className="w-16">{p.toFixed(2)}%</span>
                <ColorBlock
                  color={availableColors[i]}
                  label={formatColor(availableColors[i])}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ColorBlock: React.FC<{
  color: string;
  label: string;
  onRemove?: () => void;
  isRemovable?: boolean;
}> = ({ color, label, onRemove, isRemovable }) => {
  return (
    <div className="flex flex-col items-center justify-center relative group">
      <div
        className="w-12 h-12 m-1 rounded"
        style={{
          backgroundColor: color,
        }}
      />
      <div className="text-center text-xs">{label}</div>
      {isRemovable && (
        <button
          className="cursor-pointer absolute -top-1 -right-1 bg-red-500 text-white shadow-sm rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"
          onClick={onRemove}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ColorMixer;
