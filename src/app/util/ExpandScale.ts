export class ExpandScale {

  private domainVar: string[] = [];
  private rangeVar: [number, number] = [0, 0];

  //
  private paddingVar: number = 0;

  private expandItem: string | undefined;
  private expandIdx: number | undefined;

  private expandFactor: number = 10;

  constructor(domain?: string[], range?: [number, number]) {

  }

  // set domain
  domain(): string [] {
    return this.domainVar;
  }

  setDomain(domain: string[]): ExpandScale {
    this.domainVar = domain;
    return this;
  }

  getRange(): [number, number] {
    return this.rangeVar;
  }

  setRange(range: [number, number]): ExpandScale {
    this.rangeVar = range;
    return this;
  }

  padding(padding: number): ExpandScale {
    this.paddingVar = padding;
    return this;
  }

  setExpandItem(item: string) {
    this.expandItem = item;
    this.expandIdx = this.domainVar.findIndex(e => e === item);
    return this;
  }

  bandwidth(item?: string) {
    if (this.expandItem !== undefined) { // expand is set
      let step = Math.abs(this.rangeVar[1] - this.rangeVar[0]) / (this.domainVar.length + (this.expandFactor - 1) - this.paddingVar);
      if (item === this.expandItem) { // expanded item
        return step * this.expandFactor - (step * this.paddingVar);
      } else { // not expanded item
        return step * (1 - this.paddingVar);
      }
    } else { // normal scale
      return Math.abs(this.rangeVar[1] - this.rangeVar[0]) / (this.domainVar.length - this.paddingVar) * (1 - this.paddingVar);
    }
  }

  scale(item: string) {
    let idxItem = this.domainVar.findIndex(e => e === item);
    if (this.expandItem !== undefined) { // expand is set
      let step = Math.abs(this.rangeVar[1] - this.rangeVar[0]) / (this.domainVar.length + (this.expandFactor - 1) - this.paddingVar);
      if (idxItem > this.expandIdx!) {
        return step * (idxItem + this.expandFactor - 1);
      } else {
        return step * idxItem;
      }
    } else { // normal scale
      return Math.abs(this.rangeVar[1] - this.rangeVar[0]) / (this.domainVar.length - this.paddingVar) * idxItem;
    }
  }

}
