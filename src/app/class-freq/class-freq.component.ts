import {Component, OnInit} from '@angular/core';
import {DataSharingService} from "../service/data-sharing.service";
import * as d3 from "d3";
import {SurgeryData} from "../model/SurgeryData";
import {Observable} from "rxjs";
import {CONSTANTS} from "../constants";
import {Occurrence} from "../model/Occurrence";
import {DataCounter} from "../model/DataCounter";
import {WordWrap} from "../util/WordWrap";

@Component({
  selector: 'app-class-freq',
  templateUrl: './class-freq.component.html',
  styleUrls: ['./class-freq.component.css']
})
export class ClassFreqComponent implements OnInit {

  private localDatasetCopy: SurgeryData[] = [];
  datasetObservable$: Observable<SurgeryData[]>;

  private xPhaseScale: d3.ScalePoint<string> | undefined;
  private xInstScale: d3.ScalePoint<string> | undefined;
  private yPhaseScaleArr: d3.ScaleLinear<number, number>[] | undefined;
  private yInstScaleArr: d3.ScaleLinear<number, number>[] | undefined;

  // private phaseFrequencies: Record<string, number> = {};

  private scaleType = 0;
  private viewIdle = true;

  private svgHeight = 0;
  private svgWidth = 0;

  private margin = {top: 20, right: 10, bottom: 70, left: 50};

  constructor(private dataSharingService: DataSharingService) {
    this.datasetObservable$ = this.dataSharingService.dataset$;
  }

  ngOnInit(): void {
    // @ts-ignore
    this.svgWidth = d3.select('#class-freq-svg').node().getBoundingClientRect().width;
    // @ts-ignore
    this.svgHeight = d3.select('#class-freq-svg').node().getBoundingClientRect().height;

    // d3.select('#class-freq-select').on('change', e => {
    //   this.scaleType = +d3.select(e.currentTarget).property('value');
    //   this.drawPhaseBarChart('phase');
    //   this.drawPhaseBarChart('instrument');
    // });

    d3.select('#class-freq-scale-select').on('change', e => {
      this.scaleType = +d3.select(e.currentTarget).property('value');
      this.drawPhaseBarChart('phase');
      this.drawPhaseBarChart('instrument');
    });

    d3.select('#class-freq-idle-checkbox').on('change', e => {
      this.viewIdle = d3.select(e.currentTarget).property('checked');
      this.drawPhaseBarChart('instrument');
    });

    d3.select('.phase-freq-g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    d3.select('.instrument-freq-g')
      .attr('transform', `translate(${this.margin.left}, ${this.svgHeight / 2 + this.margin.top})`);

    this.dataSharingService.dataset$.subscribe(dataset => {
      this.localDatasetCopy = dataset;
      this.drawPhaseBarChart('phase');
      this.drawPhaseBarChart('instrument');
    })
  }

  // drawRadarChart() {
  //   const radius = d3.min([this.svgWidth / 2, this.svgHeight / 2]) || 0;
  //
  //   const margin = {left: 50, top:10, right: 10, bottom: 10};
  //
  //   const phaseFreq = this.calcPhaseFreq();
  //   const maxPhaseFreq = d3.max(phaseFreq.map(e => e.value.map(v => v.value)).flatMap(s => s)) || 0;
  //
  //   const radialScale = d3.scaleLinear()
  //     .domain([0, maxPhaseFreq])
  //     .range([0, radius - margin.top - margin.bottom]);
  //
  //   let phaseFreqG = d3.select('.phase-freq-g')
  //     .attr('transform', `translate(${radius + margin.left}, ${radius})`)
  //
  //   const circleCirc = 2 * Math.PI;
  //   const angle = circleCirc / CONSTANTS.phaseMapping.domain().length;
  //
  //   d3.select('.phase-freq-axis')
  //     .selectAll('.phase-freq-axis-line')
  //     .data(radialScale.ticks(10))
  //     .join(
  //       enter => enter.append('circle')
  //         .attr('class', 'phase-freq-axis-line')
  //         .attr('cx', 0)
  //         .attr('cy', 0)
  //         .attr('fill', 'none')
  //         .attr('stroke', 'lightgray')
  //         .attr('r', d => radialScale(d)),
  //       update => update.transition()
  //         .duration(1000)
  //         .attr('r', d => radialScale(d)),
  //       exit => exit.remove()
  //     );
  //
  //   d3.select('.phase-freq-axis')
  //     .selectAll('.phase-line')
  //     .data(CONSTANTS.phaseMapping.domain())
  //     .join(
  //       enter => enter.append('line')
  //         .attr('class', '.phase-line')
  //         .attr('x1', 0)
  //         .attr('y1', 0)
  //         .attr('x2', (d, i) => Math.sin(Math.PI + (angle * i)) * radialScale.range()[1])
  //         .attr('y2', (d, i) => Math.cos(Math.PI + (angle * i)) * radialScale.range()[1])
  //         .attr('stroke-width', 1)
  //         .attr('stroke', 'gray')
  //     )
  //
  //   // d3.select('.phase-freq-poly')
  //   //   .selectAll(`area`)
  //   //   .data(areaSorted)
  //   //   .join(
  //   //     enter => enter.append('polygon')
  //   //       .attr('class', d => `area area-${d}`)
  //   //       .attr('points', d => areaPoints[d])
  //   //       .attr('fill', d => { // todo: create a scale for colors
  //   //         if (d === 'train') {
  //   //           return 'blue'
  //   //         } else if (d === 'test') {
  //   //           return 'orange'
  //   //         } else if (d === 'validation') {
  //   //           return 'green'
  //   //         }
  //   //       })
  //   //       .attr('fill-opacity', 0.2)
  //   //       .attr('stroke', d => { // todo: create a scale for colors
  //   //         if (d === 'train') {
  //   //           return 'blue'
  //   //         } else if (d === 'test') {
  //   //           return 'orange'
  //   //         } else if (d === 'validation') {
  //   //           return 'green'
  //   //         }
  //   //       })
  //   //       .attr('stroke-width', 2)
  //   //       .on('mouseover', d => {
  //   //         let otherAreas = areaSorted.filter(e => e !== d)
  //   //         otherAreas.forEach(setName => {
  //   //           d3.select(`.area-${setName}`)
  //   //             .transition(200)
  //   //             .attr('fill-opacity', 0)
  //   //         })
  //   //         d3.select(`.area-${d}`)
  //   //           .transition(200)
  //   //           .attr('fill-opacity', 0.5)
  //   //       })
  //   //       .on('mouseout', d => {
  //   //         areaSorted.forEach(setName => {
  //   //           d3.select(`.area-${setName}`)
  //   //             .transition(200)
  //   //             .attr('fill-opacity', 0.2)
  //   //         })
  //   //       })
  //   //   )
  //
  //   CONSTANTS.datasets.forEach(set => {
  //     d3.select('.phase-freq-poly')
  //       .selectAll(`.circle-${set}`)
  //       .data(phaseFreq.find(e => e.object === set)!.value)
  //       .join(
  //         enter => enter.append('circle')
  //           .attr('class', `circle-${set}`)
  //           .attr('cx', (d, i) => Math.sin(Math.PI + (angle * i)) * radialScale(d.value))
  //           .attr('cy', (d, i) => Math.cos(Math.PI + (angle * i)) * radialScale(d.value))
  //           .attr('r', 4)
  //           .attr('fill', d => CONSTANTS.datasetColors(set))
  //           .attr('fill-opacity', 0.8)
  //           // .on('mouseover', () => {
  //           //   let otherAreas = areaSorted.filter(e => e !== setName)
  //           //   otherAreas.forEach(setName => {
  //           //     d3.select(`.area-${setName}`)
  //           //       .transition(200)
  //           //       .attr('fill-opacity', 0)
  //           //   })
  //           //   d3.select(`.area-${setName}`)
  //           //     .transition(200)
  //           //     .attr('fill-opacity', 0.5)
  //           // })
  //           // .on('mouseout', () => {
  //           //   areaSorted.forEach(setName => {
  //           //     d3.select(`.area-${setName}`)
  //           //       .transition(200)
  //           //       .attr('fill-opacity', 0.2)
  //           //   })
  //           // })
  //         ,
  //         update => update.attr('cx', (d, i) => Math.sin(Math.PI + (angle * i)) * radialScale(d.value))
  //           .attr('cy', (d, i) => Math.cos(Math.PI + (angle * i)) * radialScale(d.value))
  //           .attr('r', 4),
  //         exit => exit.remove()
  //       )
  //   })
  //   // draw labels
  //   d3.select('.phase-freq-labels').selectAll('.line-label')
  //     .data(CONSTANTS.phaseMapping.domain())
  //     .join(
  //       enter => enter.append('text')
  //         .attr('class', 'line-label')
  //         .attr('x', (d, i) => Math.cos(-1 * (angle * i - Math.PI / 2 )) * radialScale.range()[1])
  //         .attr('y', (d, i) => -1 * Math.sin(-1 * (angle * i - Math.PI / 2)) * radialScale.range()[1])
  //         .attr('font-size', 12)
  //         .attr('text-anchor', 'middle')
  //         .text(d => CONSTANTS.phaseMapping(d))
  //     )
  // }

  // drawPhaseChart() {
  //
  //   const margin = {top: 50, right: 50, bottom: 50, left: 50};
  //   d3.select('.phase-freq-g')
  //     .attr('transform', `translate(${margin.left}, ${margin.top})`);
  //
  //   this.xPhaseScale = d3.scalePoint()
  //     .domain(Object.keys(CONSTANTS.phaseMapping.domain()))
  //     .range([0, this.svgWidth - margin.left - margin.right]);
  //
  //   if (this.scaleType === 0) { // univariate scaling
  //     const maxDur = d3.max(Object.keys(CONSTANTS.phaseMapping.domain()).map(phaseId => {
  //       return d3.max(this.localDatasetCopy.map(sp => sp.phaseIndex[phaseId].map((e => e.end - e.start))).flatMap(u => u)) || 0;
  //     })) || 0;
  //
  //     this.yPhaseScaleArr = [d3.scaleLinear()
  //       .domain([0, maxDur])
  //       .range([this.svgHeight / 2 - margin.top - margin.bottom, 0])];
  //
  //   } else if (this.scaleType === 1) { // no scaling
  //     this.yPhaseScaleArr = Object.keys(CONSTANTS.phaseMapping.domain()).map(phaseId => {
  //       const maxDur = d3.max(this.localDatasetCopy.map(sp => sp.phaseIndex[phaseId].map((e => e.end - e.start))).flatMap(u => u)) || 0;
  //       // const maxDur = d3.max(phaseFreq.map(set => set.value.find(p => p.object === phaseId)?.value || 0)) || 0;
  //
  //       return d3.scaleLinear()
  //         .domain([0, maxDur])
  //         .range([this.svgHeight / 2 - margin.top - margin.bottom, 0]);
  //     });
  //   }
  //
  //
  //
  //   const lineGen = d3.line()
  //     .x(d => d[0])
  //     .y(d => d[1])
  //
  //   // for each surgery
  //   let pointG = d3.select('.phase-freq-lines')
  //     .selectAll<SVGSVGElement, SurgeryData>('.phase-line')
  //     .data(this.localDatasetCopy.filter(e => ['train', 'validation', 'test'].includes(e.set)), k => k.spNr)
  //     .join(
  //       enter => enter.append('path')
  //         .attr('class', 'phase-line')
  //         .attr('d', d => lineGen(this.calcPhaseLineData(d)))
  //         .attr('stroke-width', 2)
  //         .attr('stroke', d => CONSTANTS.datasetColors(d.set))
  //         .attr('fill', 'none')
  //         .attr('opacity', 0.2)
  //         .on('mouseover', (e, d) => {
  //           d3.select(e.currentTarget).attr('opacity', 1)
  //           d3.select('.phase-freq-tooltip')
  //             .attr('y', this.calcPhaseLineData(d)[0][1])
  //             .attr('x', 5)
  //             .text(`video${d.spNr}-phase.txt`)
  //             .attr('opacity', 1)
  //         })
  //         .on('mouseout',  (e, d) => {
  //           d3.select(e.currentTarget).attr('opacity', 0.2)
  //           d3.select('.phase-freq-tooltip')
  //             .attr('opacity', 0)
  //         }),
  //       update => update.attr('stroke', d => CONSTANTS.datasetColors(d.set)),
  //       exit => exit.remove()
  //     );
  //
  //   // for each surgery
  //   d3.select('.phase-freq-lines')
  //     .selectAll<SVGSVGElement, SurgeryData>('.phase-line-selected')
  //     .data(this.localDatasetCopy.filter(e => e.selected), k => k.spNr)
  //     .join(
  //       enter => enter.append('path')
  //         .attr('class', 'phase-line-selected')
  //         .attr('d', d => lineGen(this.calcPhaseLineData(d)))
  //         .attr('stroke-width', 5)
  //         .attr('stroke', '#fcba03')
  //         .attr('fill', 'none')
  //         .attr('opacity', 1),
  //       update => update,
  //       exit => exit.remove()
  //     );
  //
  //   d3.select('.phase-freq-axes')
  //     .selectAll('.phase-axis')
  //     .data(CONSTANTS.phaseMapping.domain())
  //     .join(
  //       enter => enter,
  //       update => update.each((d, i, nodes) => {
  //         d3.select(nodes[i])
  //           .append('g')
  //           .attr('class', 'phase-axis')
  //           .attr('transform', `translate(${this.xPhaseScale?.(i + "")},0)`)
  //           .call((d) => {
  //             if (this.scaleType === 0) {
  //               d3.axisLeft<number>(this.yPhaseScaleArr![0])
  //                 .ticks(5)
  //                 .tickFormat(d3.format('~s'))(d);
  //             } else if (this.scaleType === 1) {
  //               d3.axisLeft<number>(this.yPhaseScaleArr![i])
  //                 .ticks(5)
  //                 .tickFormat(d3.format('~s'))(d);
  //             }
  //           });
  //       })
  //     );
  //
  //   d3.select('.phase-freq-labels')
  //     .selectAll('.phase-label')
  //     .data(CONSTANTS.phaseMapping.domain())
  //     .join(
  //       enter => enter.append('text')
  //         .attr('class', 'phase-label')
  //         .text(d => CONSTANTS.phaseMapping(d))
  //         .attr('x', d => this.xPhaseScale!(d) || null)
  //         .attr('y', this.svgHeight / 2 - margin.top - margin.bottom + 15)
  //         .attr('font-size', 10)
  //         .attr('text-anchor', 'middle')
  //         .attr('alignment-baseline', 'bottom'),
  //       update => update,
  //       exit => exit.remove()
  //     )
  // }

  // drawInstChart() {
  //   const margin = {top: 50, right: 50, bottom: 50, left: 50};
  //   d3.select('.inst-freq-g')
  //     .attr('transform', `translate(${margin.left}, ${this.svgHeight / 2 + margin.top})`);
  //
  //   // const phaseFreq = this.calcPhaseFreq();
  //
  //   this.xInstScale = d3.scalePoint()
  //     .domain(Object.keys(this.localDatasetCopy[0].instIndex))
  //     .range([0, this.svgWidth - margin.left - margin.right]);
  //
  //   this.yInstScaleArr = Object.keys(this.localDatasetCopy[0].instIndex).map(inst => {
  //
  //     const maxDur = d3.max(this.localDatasetCopy.map(sp => sp.instIndex[inst].map((e => e.end - e.start))).map(u => d3.sum(u))) || 0;
  //
  //     // const maxDur = d3.max(phaseFreq.map(set => set.value.find(p => p.object === phaseId)?.value || 0)) || 0;
  //     return d3.scaleLinear()
  //       .domain([0, maxDur])
  //       .range([this.svgHeight / 2 - margin.top - margin.bottom, 0]);
  //   });
  //
  //   const lineGen = d3.line()
  //     .x(d => d[0])
  //     .y(d => d[1])
  //
  //   // for each surgery
  //   let pointG = d3.select('.inst-freq-lines')
  //     .selectAll<SVGSVGElement, SurgeryData>('.inst-line')
  //     .data(this.localDatasetCopy.filter(e => ['train', 'validation', 'test'].includes(e.set)), k => k.spNr)
  //     .join(
  //       enter => enter.append('path')
  //         .attr('class', 'inst-line')
  //         .attr('d', d => lineGen(this.calcInstLineData(d)))
  //         .attr('stroke-width', 2)
  //         .attr('stroke', d => CONSTANTS.datasetColors(d.set))
  //         .attr('fill', 'none')
  //         .attr('opacity', 0.2)
  //         .on('mouseover', (e, d) => {
  //           d3.select(e.currentTarget).attr('opacity', 1)
  //           d3.select('.inst-freq-tooltip')
  //             .attr('y', this.calcInstLineData(d)[0][1])
  //             .attr('x', 5)
  //             .text(`video${d.spNr}-tool.txt`)
  //             .attr('opacity', 1)
  //         })
  //         .on('mouseout',  (e, d) => {
  //           d3.select(e.currentTarget).attr('opacity', 0.2)
  //           d3.select('.inst-freq-tooltip')
  //             .attr('opacity', 0)
  //         })
  //         .on('click', (e, d) => {
  //           let update = this.localDatasetCopy.map(e => e.spNr === d.spNr ? {...e, selected: !e.selected} : e)
  //           this.dataSharingService.updateDataset(update);
  //         }),
  //       update => update.attr('stroke', d => CONSTANTS.datasetColors(d.set))
  //       ,
  //       exit => exit.remove()
  //     );
  //
  //   // for each surgery
  //   d3.select('.inst-freq-lines')
  //     .selectAll<SVGSVGElement, SurgeryData>('.inst-line-selected')
  //     .data(this.localDatasetCopy.filter(e => e.selected), k => k.spNr)
  //     .join(
  //       enter => enter.append('path')
  //         .attr('class', 'inst-line-selected')
  //         .attr('d', d => lineGen(this.calcInstLineData(d)))
  //         .attr('stroke-width', 5)
  //         .attr('stroke', '#fcba03')
  //         .attr('fill', 'none')
  //         .attr('opacity', 1)
  //         .on('click', (e, d) => {
  //           let update = this.localDatasetCopy.map(e => e.spNr === d.spNr ? {...e, selected: !e.selected} : e)
  //           this.dataSharingService.updateDataset(update);
  //         }).on('click', (e, d) => {
  //           let update = this.localDatasetCopy.map(e => e.spNr === d.spNr ? {...e, selected: !e.selected} : e)
  //           this.dataSharingService.updateDataset(update);
  //         }),
  //       update => update,
  //       exit => exit.remove()
  //     );
  //
  //
  //   d3.select('.inst-freq-axes')
  //     .selectAll('.inst-axis')
  //     .data(Object.keys(this.localDatasetCopy[0].instIndex))
  //     .enter()
  //     .each((d, i, nodes) => {
  //       d3.select(nodes[i])
  //         .append('g')
  //         .attr('class', 'inst-axis')
  //         .attr('transform', `translate(${this.xInstScale?.(d + "")},0)`)
  //         .call(d3.axisLeft<number>(this.yInstScaleArr![i])
  //           .ticks(5)
  //           .tickFormat(d3.format('~s')));
  //     }).exit().remove();
  //
  //   d3.select('.inst-freq-labels')
  //     .selectAll('.inst-label')
  //     .data(Object.keys(this.localDatasetCopy[0].instIndex))
  //     .join(
  //       enter => enter.append('text')
  //         .attr('class', 'inst-label')
  //         .text(d => d)
  //         .attr('x', d => this.xInstScale!(d) || null)
  //         .attr('y', this.svgHeight / 2 - margin.top - margin.bottom + 15)
  //         .attr('font-size', 10)
  //         .attr('text-anchor', 'middle')
  //         .attr('alignment-baseline', 'bottom'),
  //       update => update,
  //       exit => exit.remove()
  //     )
  // }

  private calcBarChartData(dataType: string): DataCounter<DataCounter<number>[]>[] {
    let result: DataCounter<DataCounter<number>[]>[] = [];

    let iterObj = dataType === 'phase' ? CONSTANTS.phaseMapping.domain() : CONSTANTS.instrumentMapping.domain();

    if(dataType === 'instrument' && !this.viewIdle) {
      iterObj = iterObj.filter(e => e !== CONSTANTS.instrumentMappingInverse('Idle'))
    }

    iterObj.forEach(id => { // for each phase
      let dataCounter: DataCounter<number>[] = [];

      CONSTANTS.datasets.forEach(set => { // for each dataset
        const data = this.localDatasetCopy.filter(e => e.set === set);
        const setDuration = d3.sum(data.map(e => e.duration));
        let counter = 0;
        data.forEach(sp => { // for each surgery
          const indexObj = dataType === 'phase' ? sp.phaseIndex : sp.instIndex;
          counter += d3.sum(indexObj[id].map((e: Occurrence) => e.end - e.start + 1))
        });
        dataCounter.push({object: set, value: this.scaleType === 0 ? counter : (counter / setDuration) || 0});
      });
      result.push({object: id, value: dataCounter})
    });
    return result;
  }

  private calcPhaseLineData(obj: SurgeryData): [number, number][] {
    return Object.keys(obj.phaseIndex).map((phaseId, i) => {
      let x = this.xPhaseScale?.(phaseId) || 0;

      // calculate y value according to the selected scaling
      let y = 0;
      if(this.scaleType === 0) {
        y = this.yPhaseScaleArr![0](obj.phaseIndex[phaseId].reduce((p, c) => {
          return p + (c.end - c.start);
        }, 0));
      } else if (this.scaleType === 1) {
        y = this.yPhaseScaleArr![i](obj.phaseIndex[phaseId].reduce((p, c) => {
          return p + (c.end - c.start);
        }, 0));
      }

      return [x, y];
    });
  }

  private calcInstLineData(obj: SurgeryData): [number, number][] {
    return Object.keys(this.localDatasetCopy[0].instIndex).map((instId, i) => {
      let x = this.xInstScale?.(instId) || 0;
      let y = this.yInstScaleArr![i](obj.instIndex[instId].reduce((p, c) => {
        return p + (c.end - c.start);
      }, 0));
      return [x, y];
    });
  }

  private drawPhaseBarChart(dataType: string) {

    const width = this.svgWidth - this.margin.left - this.margin.right;
    const height = this.svgHeight / 2 - this.margin.top - this.margin.bottom;

    const dataset = this.calcBarChartData(dataType);
    const maxValue = d3.max(dataset.map(e => e.value.map(v => v.value)).flatMap(s => s)) || 0;

    const xScale = d3.scaleBand()
      .domain(Object.keys(dataset))
      .range([0, width])
      .paddingInner(0.2);

    const xDatasetScale = d3.scaleBand()
      .domain(CONSTANTS.datasets)
      .range([0, xScale.bandwidth()]);

    let yScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([height, 0]);

    const group = d3.select(`.${dataType}-freq-chart-g`)
      .selectAll(`.${dataType}-bars-g`)
      .data(dataset)
      .join(
        enter => enter.append('g')
          .attr('class', `${dataType}-bars-g`)
          .attr('transform', d => `translate(${xScale(d.object + "")},0)`),
        update => update.attr('transform', d => `translate(${xScale(d.object + "")},0)`)
      );

    d3.select<SVGSVGElement, unknown>(`.${dataType}-freq-axis-y`)
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d3.format(this.scaleType === 0 ?'.2s' : '.0%')))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll('.tick')
        .select('text')
        .attr('fill', 'lightgray'))
      .call(g => g.selectAll('.tick')
        .select('line')
        .attr('stroke', 'lightgray')
        .attr('x1', width)
        .attr('stroke-dasharray', 2));

    group.selectAll(`.${dataType}-freq-rect`)
      .data(d => d.value)
      .join(
        enter => enter.append('rect')
          .attr('class', `${dataType}-freq-rect`)
          .attr('x', d => xDatasetScale(d.object) || 0)
          .attr('y', yScale.range()[0])
          .attr('width', xDatasetScale.bandwidth())
          .attr('height', 0)
          .attr('fill', d => CONSTANTS.datasetColors(d.object)),
        // .attr('opacity', 0.5),
        update => update.attr('x', d => xDatasetScale(d.object) || 0)
          .attr('width', xDatasetScale.bandwidth())
      ).transition().duration(1000)
      .attr('height', d => yScale(0) - yScale(d.value))
      .attr('y', d => yScale(d.value) || 0);

    d3.select<SVGSVGElement, unknown>(`.${dataType}-freq-axis-x`)
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d => dataType === 'phase' ? CONSTANTS.phaseMapping(d) : CONSTANTS.instrumentMapping(d))
        .tickSizeOuter(0))
      .call(g => g.selectAll(".tick").select('line').remove())
      .call(g => g.selectAll<SVGSVGElement, string>('.tick')
        .select<SVGTextElement>('text')
        .attr('font-size', 10)
        .call(WordWrap.wrap, xScale));

    group.selectAll(`.${dataType}-freq-rect-label`)
      .data(d => d.value)
      .join(
        enter => enter.append('text')
          .attr('class', `${dataType}-freq-rect-label`)
          .attr('x', d => (xDatasetScale(d.object) || 0) + xDatasetScale.bandwidth() / 2)
          .attr('y', yScale.range()[0])
          .attr('fill', 'gray')
          .attr('opacity', 0.6)
          .attr('text-anchor', 'middle')
          .attr('font-size', 10)
          // .attr('textLength', xDatasetScale.bandwidth() + 'px')
          .text(d => d3.format(this.scaleType === 0 ?'.0s' : '.0%')(d.value)),
        update => update.attr('x', d => (xDatasetScale(d.object) || 0) + xDatasetScale.bandwidth() / 2)
          .text(d => d3.format(this.scaleType === 0 ?'.0s' : '.0%')(d.value))
      ).transition().duration(1000)
      .attr('y', d => (yScale(d.value) || 0) - 3);
  }

}
