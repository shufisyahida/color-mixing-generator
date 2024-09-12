function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

function mixColors(colors: string[], percentages: number[]): string {
  const rgbColors = colors.map(hexToRgb);
  const mixed = rgbColors.reduce<[number, number, number]>((acc, color, i) => {
    return [
      acc[0] + color[0] * (percentages[i] / 100),
      acc[1] + color[1] * (percentages[i] / 100),
      acc[2] + color[2] * (percentages[i] / 100)
    ];
  }, [0, 0, 0]);
  return rgbToHex(Math.round(mixed[0]), Math.round(mixed[1]), Math.round(mixed[2]));
}

function colorDistance(color1: string, color2: string): number {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  if (r === 0 && g === 0 && b === 0) {
    return [0, 0, 0, 100];
  }

  const k = 1 - Math.max(r / 255, g / 255, b / 255);
  const c = (1 - r / 255 - k) / (1 - k) || 0;
  const m = (1 - g / 255 - k) / (1 - k) || 0;
  const y = (1 - b / 255 - k) / (1 - k) || 0;
  return [c * 100, m * 100, y * 100, k * 100];
}

function cmykToRgb(c: number, m: number, y: number, k: number): [number, number, number] {
  const r = 255 * (1 - c / 100) * (1 - k / 100);
  const g = 255 * (1 - m / 100) * (1 - k / 100);
  const b = 255 * (1 - y / 100) * (1 - k / 100);
  return [Math.round(r), Math.round(g), Math.round(b)];
}

function hexToCmyk(hex: string): [number, number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return rgbToCmyk(r, g, b);
}

function cmykToHex(c: number, m: number, y: number, k: number): string {
  const [r, g, b] = cmykToRgb(c, m, y, k);
  return rgbToHex(r, g, b);
}

interface ColorMix {
  color: string;
  percentage: number;
}

function mixColorsCMYK(colorMixes: ColorMix[]): string {
  if (colorMixes.length === 0) {
    throw new Error("At least one color mix must be provided");
  }

  // Normalize percentages
  const totalPercentage = colorMixes.reduce((sum, mix) => sum + mix.percentage, 0);
  const normalizedMixes = colorMixes.map(mix => ({
    ...mix,
    percentage: mix.percentage / totalPercentage
  }));

  // Convert hex colors to CMYK and calculate weighted sum
  const mixedCMYK = normalizedMixes.reduce((acc, mix) => {
    const cmyk = hexToCmyk(mix.color);
    return [
      acc[0] + cmyk[0] * mix.percentage,
      acc[1] + cmyk[1] * mix.percentage,
      acc[2] + cmyk[2] * mix.percentage,
      acc[3] + cmyk[3] * mix.percentage
    ];
  }, [0, 0, 0, 0]);

  // Convert back to hex
  return cmykToHex(mixedCMYK[0], mixedCMYK[1], mixedCMYK[2], mixedCMYK[3]);
}

export function findColorMix(availableColors: string[], targetColor: string, useCmyk: boolean = true): { color: string; percentages: number[]; distance: number } {
  const populationSize = 100;
  const generations = 100;
  const mutationRate = 0.1;

  // Generate initial population
  let population = Array.from({ length: populationSize }, () => 
    generateRandomPercentages(availableColors.length)
  );

  let bestMatch = evaluateIndividual(population[0]);

  for (let gen = 0; gen < generations; gen++) {
    // Evaluate population
    const evaluated = population.map(evaluateIndividual);
    
    // Update best match
    const generationBest = evaluated.reduce((a, b) => a.distance < b.distance ? a : b);
    if (generationBest.distance < bestMatch.distance) {
      bestMatch = generationBest;
    }

    // Select parents and create new population
    population = Array.from({ length: populationSize }, () => {
      const parent1 = tournamentSelect(evaluated);
      const parent2 = tournamentSelect(evaluated);
      return crossover(parent1.percentages, parent2.percentages);
    });

    // Apply mutation
    population = population.map(individual => 
      Math.random() < mutationRate ? mutate(individual) : individual
    );
  }

  return bestMatch;

  function evaluateIndividual(percentages: number[]): { color: string; percentages: number[]; distance: number } {
    const mixedColor = mixColors(availableColors, percentages);
    const distance = useCmyk
      ? cmykDistance(mixedColor, targetColor)
      : colorDistance(mixedColor, targetColor);
    return { color: mixedColor, percentages, distance };
  }

  function generateRandomPercentages(length: number): number[] {
    const percentages = Array.from({ length }, () => Math.random());
    const sum = percentages.reduce((a, b) => a + b, 0);
    return percentages.map(p => (p / sum) * 100);
  }

  function tournamentSelect(population: Array<{ percentages: number[]; distance: number }>, tournamentSize = 5): { percentages: number[]; distance: number } {
    return Array.from({ length: tournamentSize }, () => population[Math.floor(Math.random() * population.length)])
      .reduce((a, b) => a.distance < b.distance ? a : b);
  }

  function crossover(parent1: number[], parent2: number[]): number[] {
    const crossoverPoint = Math.floor(Math.random() * parent1.length);
    const child = [...parent1.slice(0, crossoverPoint), ...parent2.slice(crossoverPoint)];
    return normalizePercentages(child);
  }

  function mutate(individual: number[]): number[] {
    const index = Math.floor(Math.random() * individual.length);
    individual[index] += (Math.random() - 0.5) * 10; // Adjust by up to ±5%
    return normalizePercentages(individual);
  }

  function normalizePercentages(percentages: number[]): number[] {
    const sum = percentages.reduce((a, b) => a + b, 0);
    return percentages.map(p => Math.max(0, Math.min(100, (p / sum) * 100)));
  }
}

function cmykDistance(color1: string, color2: string): number {
  const [c1, m1, y1, k1] = hexToCmyk(color1);
  const [c2, m2, y2, k2] = hexToCmyk(color2);
  return Math.sqrt((c1 - c2) ** 2 + (m1 - m2) ** 2 + (y1 - y2) ** 2 + (k1 - k2) ** 2);
}

export { hexToCmyk, cmykToHex };