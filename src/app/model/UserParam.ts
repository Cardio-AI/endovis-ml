export interface UserParam {
  phaseFileSuffix: string;
  instFileSuffix: string;
  phaseLabels: string[];
  instLabels: string[];
  splits: Record<string, number[]>[];
  testSplit: number[];
}
