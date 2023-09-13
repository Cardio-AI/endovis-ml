import {Component, OnInit} from '@angular/core';
import {SurgeryData} from "../model/SurgeryData";
import {Observable} from "rxjs";
import {DataSharingService} from "../service/data-sharing.service";
import * as d3 from "d3";
import {CONSTANTS} from "../constants";
import {DataCounter} from "../model/DataCounter";
import {HistogramBin} from "../model/HistogramBin";
import {ExpandService} from "../service/expand.service";
import {ExpandScale} from "../util/ExpandScale";

@Component({
  selector: 'app-phase-param',
  templateUrl: './phase-param.component.html',
  styleUrls: ['./phase-param.component.css']
})
export class PhaseParamComponent implements OnInit {

  private localDatasetCopy: SurgeryData[] = [];
  private expandedItem: string | undefined;
  private datasetObservable$: Observable<SurgeryData[]>;
  private expandObservable$: Observable<string | undefined>;

  private svgHeight = 0;
  private svgWidth = 0;
  private viewType = 0;

  private nrBins = 5;
  private histogram = true;

  constructor(private dataSharingService: DataSharingService, private expandService: ExpandService) {
    this.datasetObservable$ = this.dataSharingService.dataset$;
    this.expandObservable$ = this.expandService.expandedItem$;
  }

  ngOnInit(): void {
    // @ts-ignore
    this.svgWidth = d3.select('#phase-param-svg').node().getBoundingClientRect().width;
    // @ts-ignore
    this.svgHeight = d3.select('#phase-param-svg').node().getBoundingClientRect().height;

    d3.select('#param-select').on('change',(e) => {
      this.viewType = +d3.select(e.currentTarget).property('value');
      this.drawPhaseParams();
    });

    this.dataSharingService.dataset$.subscribe(dataset => {
      this.localDatasetCopy = dataset;
      this.drawPhaseParams();
    })

    this.expandService.expandedItem$.subscribe(expandItem => {
      this.expandedItem = expandItem;
      this.drawPhaseParams();
    })
  }

  private drawPhaseParams() {
    const margin = {top: 50, right: 50, bottom: 50, left: 50};
    const binPadding = 2;


    // 'any' type is necessary here
    let data: any = [];
    switch (this.viewType) {
      case 0:
        data = this.calcPhaseOcc();
        this.histogram = true;
        break;
      case 1:
        data = this.calcPhaseDuration();
        this.histogram = true;
        break;
      case 2:
        data = this.calcPrevPhase();
        this.histogram = false;
        break;
      case 3:
        data = this.calcNextPhase();
        this.histogram = false;
        break;
      case 4:
        data = this.calcInstUsage();
        this.histogram = false;
        break;
    }

    let xDatasetScale = d3.scaleBand()
      .domain(CONSTANTS.datasets)
      .range([0, this.svgWidth])
      .paddingInner(0.2)
      .paddingOuter(0.1);

    // let yScaleModule = d3.scaleBand()
    //   .domain(data.map((e: DataCounter<DataCounter<any[]>[]>) => e.object))
    //   .range([0, this.svgHeight])
    //   .paddingInner(0.1);

    let yScaleModule = new ExpandScale()
      .setDomain(data.map((e: DataCounter<DataCounter<any[]>[]>) => e.object))
      .setRange([0, this.svgHeight])
      .padding(0.1);

    let yScaleItemExpanded: d3.ScaleLinear<number, number>;
    if(this.expandedItem !== undefined) {
      yScaleModule = yScaleModule.setExpandItem(this.expandedItem);

      yScaleItemExpanded = d3.scaleLinear()
        .domain([0, 1])
        .range([yScaleModule.bandwidth(this.expandedItem) / 2, 0])
    }

    let yScaleItem = d3.scaleLinear()
      .domain([0, 1])
      .range([yScaleModule.bandwidth() / 2, 0]);

    let dataset: DataCounter<DataCounter<any[]>[]>[];
    let minMax: [number, number] = [0, 0];

    if (this.histogram) {
      let minMaxExtent: [number, number] | [undefined, undefined];
      minMaxExtent = d3.extent<number>(data.map((e: DataCounter<DataCounter<number[]>[]>) => e.value.map((v) => v.value)).flatMap((s: number[]) => s.flatMap(d => d)));
      minMax = [minMaxExtent[0] || 0, minMaxExtent[1] || 0]; // convert to number type
      dataset = this.convertToHist(data, minMax);
    } else { // barchart
      dataset = data;
    }

    let itemGroups = d3.select('.phase-param-hist-g')
      .selectAll('.phase-param-hist-item-g')
      .data<DataCounter<DataCounter<any[]>[]>>(dataset)
      .join(
        enter => enter.append('g')
          .attr('class', 'phase-param-hist-item-g')
          .attr('transform', (d: DataCounter<DataCounter<any[]>[]>) => `translate(0, ${(yScaleModule.scale(d.object) || 0)})`),
        update => update.attr('transform', d => `translate(0, ${(yScaleModule.scale(d.object) || 0)})`)
      );

    // itemGroups.selectAll('.axis-line')
    //   .data(d => d.value)
    //   .join(
    //   enter => enter.append('line')
    //     .attr('class', 'axis-line')
    //     .attr('x1', 0)
    //     .attr('x2', this.svgWidth)
    //     // .attr('y1', d => (yScaleModule(d) || 0) + yScaleModule.bandwidth() / 2)
    //     // .attr('y2', d =>  (yScaleModule(d) || 0) + yScaleModule.bandwidth() / 2)
    //     .attr('stroke', 'gray')
    //     .attr('stroke-width', 1)
    //     .attr('opacity', 0.4)
    //   );

    itemGroups.each((item, i, nodes) => {
      let setGroups = d3.select(nodes[i])
        .selectAll('.set-g')
        .data(item.value)
        .join(
          enter => enter.append('g')
            .attr('class', 'set-g')
            .attr('transform', d => `translate(${(xDatasetScale(d.object) || 0)}, 0)`)
            .attr('fill', d => CONSTANTS.datasetColors(d.object))
        );

      if (this.histogram) {
        // const maxHistValue = d3.max<number>(dataset.map((item: DataCounter<DataCounter<HistogramBin[]>[]>) => item.value.flatMap(set => set.value)).flatMap((bin: HistogramBin[]) => bin.map(u => u.value))) || 0;

        let histXScale = d3.scaleLinear()
          .domain(minMax)
          .range([0, xDatasetScale.bandwidth()]);

        setGroups.selectAll('.param-bar')
          .data<HistogramBin>(d => d.value)
          .join(
            enter => enter.append('rect')
              .attr('class', 'param-bar')
              .attr('x', d => histXScale(d.x0 || 0))
              .attr('width', d => histXScale((d.x1 || 0) - (d.x0 || 0)) - binPadding),
            update => update.attr('width', d => histXScale((d.x1 || 0) - (d.x0 || 0)) - binPadding)
              .attr('x', d => histXScale(d.x0 || 0))
          ).attr('y', this.expandedItem === item.object ? yScaleItemExpanded.range()[0] : yScaleItem.range()[0])
          .attr('height', 0)
          .transition().duration(1000)
          .attr('y', d => this.expandedItem === item.object ? yScaleItemExpanded(d.value) : yScaleItem(d.value))
          .attr('height', d => this.expandedItem === item.object ? yScaleItemExpanded.range()[0] - yScaleItemExpanded(d.value) : yScaleItem.range()[0] - yScaleItem(d.value));

        setGroups.selectAll<SVGSVGElement, DataCounter<HistogramBin>[]>('.axis')
          .data(d => [d])
          .join(
            enter => enter.append('g')
              .attr('class', 'axis')
              .attr('transform', `translate(0, ${yScaleModule.bandwidth(item.object) / 2})`),
            update => update.attr('transform', `translate(0, ${yScaleModule.bandwidth(item.object) / 2})`)
      ).call(d3.axisBottom(histXScale)
          .ticks(this.nrBins, '~s')
          .tickSizeOuter(0))
          .call(g => g.select(".domain")
            .attr('stroke', 'darkgray'))
          .call(g => g.selectAll('.tick')
            .select('text')
            .attr('fill', 'darkgray')
            .attr("transform", "rotate(0)"))
          .call(g => g.selectAll('.tick')
            .select('line')
            .remove());
      } else { // barchart
        const maxBarValue = d3.max<number>(dataset.map((item: DataCounter<DataCounter<DataCounter<number>[]>[]>) => item.value.flatMap(set => set.value)).flatMap((bin: DataCounter<number>[]) => bin.map(u => u.value))) || 0;

        // todo: not very clean
        const barBins = dataset[0].value[0].value.map((e: DataCounter<number>) => e.object);

        let barXScale = d3.scaleBand()
          .domain(barBins)
          .range([0, xDatasetScale.bandwidth()])
          .paddingInner(0.1);

        // let barYScale = d3.scaleLinear()
        //   .domain([0, 1])
        //   .range([yScaleModule.bandwidth() / 2, 0]);

        setGroups.selectAll('.param-bar')
          .data<DataCounter<number>>(d => d.value)
          .join(
            enter => enter.append('rect')
              .attr('class', 'param-bar')
              .attr('x', d => barXScale(d.object) || 0)
              .attr('width', barXScale.bandwidth()),
            // .attr('opacity', 0.5),
            update => update.attr('width', barXScale.bandwidth())
              .attr('x', d => barXScale(d.object) || 0)
          ).attr('y', this.expandedItem === item.object ? yScaleItemExpanded.range()[0] : yScaleItem.range()[0])
          .attr('height', 0)
          .transition().duration(1000)
          .attr('y', d => this.expandedItem === item.object ? yScaleItemExpanded(d.value) : yScaleItem(d.value))
          .attr('height', d => this.expandedItem === item.object ? yScaleItemExpanded.range()[0] - yScaleItemExpanded(d.value) : yScaleItem.range()[0] - yScaleItem(d.value));

        setGroups.selectAll<SVGSVGElement, DataCounter<DataCounter<number>>>('.axis')
          .data(d => [d])
          .join(
            enter => enter.append('g')
              .attr('class', 'axis')
              .attr('transform', `translate(0, ${yScaleModule.bandwidth(item.object) / 2})`),
            update => update.attr('transform', `translate(0, ${yScaleModule.bandwidth(item.object) / 2})`)
          ).call(d3.axisBottom(barXScale)
          .tickSizeOuter(0))
          .call(g => g.select(".domain")
            .attr('stroke', 'darkgray'))
          .call(g => g.selectAll('.tick')
              .select('text')
              .attr('fill', 'darkgray')
              .attr("transform", "rotate(-45)")
              .attr("text-anchor", "end")
            // .attr('alignment-baseline', 'baseline')
          )
          .call(g => g.selectAll('.tick')
            .select('line')
            .remove());
      }
    })
  }

  private calcPhaseOcc(): DataCounter<DataCounter<number[]>[]>[] {
    let result: DataCounter<DataCounter<number[]>[]>[] = [];

    CONSTANTS.phaseMapping.domain().forEach(phaseId => { // for each phase
      let dataCounter: DataCounter<number[]>[] = [];

      CONSTANTS.datasets.forEach(set => { // for each dataset
        const data = this.localDatasetCopy.filter(e => e.set === set);
        let countArr: number[] = [];
        data.forEach(sp => { // for each surgery
          countArr.push(sp.phaseIndex[phaseId].length);
        });
        dataCounter.push({object: set, value: countArr});
      });
      result.push({object: phaseId, value: dataCounter})
    });
    return result;
  }

  private calcPhaseDuration(): DataCounter<DataCounter<number[]>[]>[] {
    let result: DataCounter<DataCounter<number[]>[]>[] = [];

    CONSTANTS.phaseMapping.domain().forEach(phaseId => { // for each phase
      let dataCounter: DataCounter<number[]>[] = [];

      CONSTANTS.datasets.forEach(set => { // for each dataset
        const data = this.localDatasetCopy.filter(e => e.set === set);
        let durations: number[] = [];
        data.forEach(sp => { // for each surgery
          durations.push(sp.phaseIndex[phaseId].reduce((p, occ) => p + (occ.end - occ.start), 0));
        });
        dataCounter.push({object: set, value: durations});
      });
      result.push({object: phaseId, value: dataCounter})
    });
    return result;
  }

  private calcNextPhase(): DataCounter<DataCounter<DataCounter<number>[]>[]>[] {
    let result: DataCounter<DataCounter<DataCounter<number>[]>[]>[] = [];

    CONSTANTS.phaseMapping.domain().forEach(phaseId => { // for each phase
      let dataCounter: DataCounter<DataCounter<number>[]>[] = [];

      CONSTANTS.datasets.forEach(set => { // for each dataset
        const data = this.localDatasetCopy.filter(e => e.set === set);
        let occCount = 0;
        let nextPhases: DataCounter<number>[] = CONSTANTS.phaseMapping.domain().map(e => {
          return {object: e, value: 0}
        });
        data.forEach(sp => { // for each surgery
          sp.phaseIndex[phaseId].map(occ => occ.end).forEach(endFrame => {
            occCount++;
            let frameIdx = sp.phaseData.findIndex(e => e.frame === endFrame);
            if (frameIdx !== undefined) {
              let nextPhaseId = sp.phaseData[frameIdx + 1]?.phase + "";
              let countObj = nextPhases.find(e => e.object === nextPhaseId);
              if (countObj !== undefined) {
                countObj.value += 1;
              }
            }
          });
        });
        nextPhases.forEach(e => e.value /= occCount); // normalize values
        dataCounter.push({object: set, value: nextPhases});
      });
      result.push({object: phaseId, value: dataCounter})
    });
    return result;
  }

  private calcPrevPhase(): DataCounter<DataCounter<DataCounter<number>[]>[]>[] {
    let result: DataCounter<DataCounter<DataCounter<number>[]>[]>[] = [];

    CONSTANTS.phaseMapping.domain().forEach(phaseId => { // for each phase
      let dataCounter: DataCounter<DataCounter<number>[]>[] = [];

      CONSTANTS.datasets.forEach(set => { // for each dataset
        const data = this.localDatasetCopy.filter(e => e.set === set);
        let occCount = 0;
        let prevPhases: DataCounter<number>[] = CONSTANTS.phaseMapping.domain().map(e => {
          return {object: e, value: 0}
        });
        data.forEach(sp => { // for each surgery
          sp.phaseIndex[phaseId].map(occ => occ.start).forEach(startFrame => {
            occCount++;
            let frameIdx = sp.phaseData.findIndex(e => e.frame === startFrame);
            if (frameIdx !== undefined) {
              let nextPhaseId = sp.phaseData[frameIdx - 1]?.phase + "";
              let countObj = prevPhases.find(e => e.object === nextPhaseId);
              if (countObj !== undefined) {
                countObj.value += 1;
              }
            }
          });
        });
        prevPhases.forEach(e => e.value /= occCount); // normalize values
        dataCounter.push({object: set, value: prevPhases});
      });
      result.push({object: phaseId, value: dataCounter})
    });
    return result;
  }

  private calcInstUsage(): DataCounter<DataCounter<DataCounter<number>[]>[]>[] {
    let result: DataCounter<DataCounter<DataCounter<number>[]>[]>[] = [];

    this.histogram = false;

    CONSTANTS.phaseMapping.domain().forEach(phaseId => { // for each phase
      let dataCounter: DataCounter<DataCounter<number>[]>[] = [];

      CONSTANTS.datasets.forEach(set => { // for each dataset
        const data = this.localDatasetCopy.filter(e => e.set === set);
        let phaseSetNrFrames = 0;
        let instCounter: DataCounter<number>[] = [];
        data.forEach(sp => { // for each surgery
          let phaseIndex = sp.phaseIndex[phaseId];

          phaseIndex.forEach(occ => { // for each occurrence (phase segment)

            let instrumentRecords = sp.instData.filter(instFrame => instFrame['Frame'] >= occ.start && instFrame['Frame'] <= occ.end);
            instrumentRecords.forEach(instFrame => {
              phaseSetNrFrames++;
              Object.keys(instFrame).filter(col => col !== 'Frame').forEach(instLabel => {
                let countObj = instCounter.find(e => e.object === instLabel);
                if (countObj !== undefined) {
                  countObj.value += instFrame[instLabel];
                } else {
                  instCounter.push({object: instLabel, value: instFrame[instLabel]});
                }
              });

              // count idle frames
              let allInst = Object.keys(instFrame).filter(col => col !== 'Frame').map(e => instFrame[e])
              if (allInst.every(e => e === 0)) {
                let idleCountObj = instCounter.find(e => e.object === 'Idle');
                if (idleCountObj !== undefined) {
                  idleCountObj.value += 1;
                } else {
                  instCounter.push({object: 'Idle', value: 1});
                }
              }
            });
          });
        });
        instCounter.forEach(e => e.value /= phaseSetNrFrames); // normalize values
        dataCounter.push({object: set, value: instCounter});
      });
      result.push({object: phaseId, value: dataCounter})
    });
    return result;
  }

  private convertToHist(data: DataCounter<DataCounter<number[]>[]>[], minMax: [number, number]): DataCounter<DataCounter<HistogramBin[]>[]>[] {
    let result: DataCounter<DataCounter<HistogramBin[]>[]>[] = [];

    const hist = d3.bin()
      .domain(minMax)
      .thresholds((data, min, max) => d3.range(this.nrBins).map(t => min + (t / this.nrBins) * (max - min)));

    data.forEach(item => {
      let newItems: DataCounter<HistogramBin[]>[] = [];
      item.value.forEach(set => {
        let nrSps = this.localDatasetCopy.filter(e => e.set === set.object).length;

        let bins = hist(set.value).map(e => {
          return {
            x0: e.x0 || 0,
            x1: e.x1 || 0,
            value: e.length / nrSps
          }
        })
        newItems.push({object: set.object, value: bins});
      })
      result.push({object: item.object, value: newItems});
    })

    return result;
  }

}
