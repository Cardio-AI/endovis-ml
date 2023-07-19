import {Component, OnInit} from '@angular/core';
import {SurgeryData} from "../model/SurgeryData";
import {DataSharingService} from "../service/data-sharing.service";
import * as d3 from 'd3';
import {CONSTANTS} from "../constants";
import {DataCounterNew} from "../model/DataCounterNew";
import {Occurrence} from "../model/Occurrence";
import {InstrumentSelectionService} from "../instrument-selection.service";
import {PhaseSelectionService} from "../service/phase-selection.service";

@Component({
  selector: 'app-set-overview',
  templateUrl: './set-overview.component.html',
  styleUrls: ['./set-overview.component.css']
})
export class SetOverviewComponent implements OnInit {

  private localDatasetCopy: SurgeryData[] = [];
  private localSelectionCopy: DataCounterNew<number, Occurrence[]>[] = [];

  private svgWidth: number = 0;
  private svgHeight: number = 0;

  constructor(private dataSharingService: DataSharingService, private phaseSelectionService: PhaseSelectionService, private instrumentSelectionService: InstrumentSelectionService) {
  }

  ngOnInit(): void {
    // @ts-ignore
    this.svgWidth = d3.select('#set-overview-svg').node().getBoundingClientRect().width;
    // @ts-ignore
    this.svgHeight = d3.select('#set-overview-svg').node().getBoundingClientRect().height;

    this.dataSharingService.dataset$.subscribe(dataset => {
      this.localSelectionCopy = [];
      this.localDatasetCopy = dataset;
      this.drawCharts();
    });

    this.phaseSelectionService.selection$.subscribe(selection => {
      this.localSelectionCopy = selection;
      this.drawCharts();
    });

    this.instrumentSelectionService.selection$.subscribe(selection => {
      this.localSelectionCopy = selection;
      this.drawCharts();
    });
  }

  // drawPieChart() {
  //   let setFrames = this.getNrFramesPerSet();
  //
  //   // pie generator
  //   let pie = d3.pie<SetDuration>()
  //     .sort(null)
  //     .value(d => d.duration);
  //
  //   let arc = d3.arc<PieArcDatum<SetDuration>>()
  //     .innerRadius(0)
  //     .outerRadius(100)
  //
  //   let data_ready = pie(setFrames);
  //
  //   d3.select('.pie-chart-g')
  //     .selectAll('.set-duration')
  //     .data(data_ready)
  //     .join(
  //       enter => enter.append('path')
  //         .attr('class', d => `set-duration ${d.data.set}`)
  //         .attr('fill', d => CONSTANTS.datasetColors(d.data.set))
  //         .attr('d', arc)
  //         .each(function (d) {
  //           // @ts-ignore
  //           this._current = d;
  //         })
  //         .attr('opacity', 0.5),
  //       update => update
  //         .transition()
  //         .duration(1000)
  //         .attrTween("d", function (a) {
  //           // @ts-ignore
  //           let customInterpolator = d3.interpolate(this._current, a);
  //           // @ts-ignore
  //           this._current = customInterpolator(0);
  //           return function (t) {
  //             return arc(customInterpolator(t))!;
  //           };
  //         })
  //     );
  // }

  private drawCharts() {
    const margin = {top: 20, right: 10, bottom: 40, left: 10}; // global chart margin

    const mainWidthFactor = 0.5;
    const mainChartWidth = this.svgWidth * mainWidthFactor - margin.left;
    const mainSpaceBetweenCharts = 10;
    const mainLabelTopMargin = 25;

    const secondaryMarginLeft = 60;
    const secondaryChartWidth = this.svgWidth * (1 - mainWidthFactor) - margin.right - secondaryMarginLeft;
    const secondaryLabelMarginLeft = 15;

    const selectedSps = this.selectionToSurgeryData(this.localSelectionCopy);

    // dataset scale
    const setYScale = d3.scaleBand()
      .domain(CONSTANTS.datasets)
      .range([0, this.svgHeight - margin.top - margin.bottom])
      .padding(.1);

    let setFrames = this.getNrFramesPerSet(this.localDatasetCopy);
    let maxFrames = d3.max(setFrames.map(e => e.value)) || 1;

    let setFiles = this.getNrFilesPerSet(this.localDatasetCopy);
    let maxFiles = d3.max(setFiles.map(e => e.value)) || 1;

    const framesBarChartXScale = d3.scaleLinear()
      .domain([0, maxFrames])
      .range([0, (mainChartWidth - mainSpaceBetweenCharts) / 2]);

    const filesBarChartXScale = d3.scaleLinear()
      .domain([0, maxFiles])
      .range([(mainChartWidth - mainSpaceBetweenCharts) / 2, 0]);

    d3.select('.set-overview-charts')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // set labels
    d3.select('.set-overview-main-chart')
        .selectAll('.bar-chart-label')
        .data(CONSTANTS.datasets)
        .join(
          enter => enter.append('text')
            .attr('class', 'bar-chart-label')
            .attr('x', mainChartWidth / 2)
            .attr('y', d => (setYScale(d) || 0) + setYScale.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', 12)
            .text(d => d.charAt(0).toUpperCase() + d.slice(1))
        );

    // number of files per set
    d3.select('.files-bar-chart-g')
      .selectAll<SVGSVGElement, DataCounterNew<string, number>>('.files-rect')
      .data(setFiles, k => k.object)
      .join(
        enter => enter.append('rect')
          .attr('class', 'files-rect')
          .attr('x', filesBarChartXScale(0))
          .attr('width', 0)
          .attr('height', setYScale.bandwidth())
      ).attr('fill', d => {
      if (this.localSelectionCopy.length === 0) {
        return CONSTANTS.datasetColors(d.object);
      } else {
        return 'lightgray';
      }
    }).attr('y', d => setYScale(d.object) || 0)
      .transition()
      .duration(1000)
      .attr('x', d => filesBarChartXScale(d.value))
      .attr('width', d => filesBarChartXScale(0) - filesBarChartXScale(d.value));

    d3.select('.files-bar-chart-g')
      .selectAll('.files-rect-selected')
      .data(this.getNrFilesPerSet(selectedSps))
      .join(
        enter => enter.append('rect')
          .attr('class', 'files-rect-selected')
          .attr('x',  filesBarChartXScale(0))
          .attr('height', setYScale.bandwidth())
          .attr('fill', d => CONSTANTS.datasetColors(d.object))
          .attr('width', 0)
      ).attr('y', d => setYScale(d.object) || 0)
      .transition()
      .duration(1000)
      .attr('x', d => filesBarChartXScale(d.value))
      .attr('width', d => filesBarChartXScale(0) - filesBarChartXScale(d.value));

    d3.select<SVGGElement, any>('.files-bar-chart-axis-g')
      .attr('transform', `translate(0,${setYScale.range()[1]})`)
      .call(d3.axisBottom<number>(filesBarChartXScale)
        .tickValues(filesBarChartXScale.ticks(5).filter((tick:number) => Number.isInteger(tick)))
        .tickFormat(d3.format('~s')))
      .call(g => g.select(".domain")
        .attr('stroke', 'gray'))
      .call(g => g.selectAll('.tick')
        .select('text')
        .attr('fill', 'gray'))
      .call(g => g.selectAll('.tick')
        .select('line')
        .attr('stroke', 'gray'));

    d3.select('.files-bar-chart-g')
      .selectAll('.files-bar-chart-label')
      .data(['No. of files'])
      .join(
        enter => enter.append('text')
          .attr('class', 'files-bar-chart-label')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'hanging')
          .attr('y', setYScale.range()[1] + mainLabelTopMargin)
          .attr('x', (mainChartWidth - mainSpaceBetweenCharts) / 4)
          .attr('font-size', 12)
          .html(d => d)
      );

    // number of frames per set
    d3.select('.frames-bar-chart-g')
      .attr('transform', `translate(${(mainChartWidth + mainSpaceBetweenCharts) / 2}, 0)`)
      .selectAll<SVGSVGElement, DataCounterNew<string, number>>('.frames-rect')
      .data(setFrames, k => k.object)
      .join(
        enter => enter.append('rect')
          .attr('class', 'frames-rect')
          .attr('x', framesBarChartXScale(0))
          .attr('width', 0)
          .attr('height', setYScale.bandwidth())
      ).attr('fill', d => {
      if (this.localSelectionCopy.length === 0) {
        return CONSTANTS.datasetColors(d.object);
      } else {
        return 'lightgray';
      }
    }).attr('y', d => setYScale(d.object) || null)
      .transition()
      .duration(1000)
      .attr('width', d => framesBarChartXScale(d.value));


    // number of frames per set (selection)
    d3.select('.frames-bar-chart-g')
      .selectAll('.frames-rect-selected')
      .data(this.getNrFramesPerSet(selectedSps))
      .join(
        enter => enter.append('rect')
          .attr('class', 'frames-rect-selected')
          .attr('x', framesBarChartXScale(0))
          .attr('height', setYScale.bandwidth())
          .attr('fill', d => CONSTANTS.datasetColors(d.object))
          .attr('width', 0)
      ).attr('y', d => setYScale(d.object) || 0)
      .transition()
      .duration(1000)
      .attr('width', d => framesBarChartXScale(d.value));

    // axis number of frames per set
    d3.select<SVGGElement, any>('.frames-bar-chart-axis-g')
      .attr('transform', `translate(0,${setYScale.range()[1]})`)
      .call(d3.axisBottom<number>(framesBarChartXScale)
        .tickValues(framesBarChartXScale.ticks(5).filter((tick:number) => Number.isInteger(tick)))
        .tickFormat(d3.format('~s')))
      .call(g => g.select(".domain")
        .attr('stroke', 'gray'))
      .call(g => g.selectAll('.tick')
        .select('text')
        .attr('fill', 'gray'))
      .call(g => g.selectAll('.tick')
        .select('line')
        .attr('stroke', 'gray'));

    d3.select('.frames-bar-chart-g')
      .selectAll('.frames-bar-chart-label')
      .data(['No. of frames'])
      .join(
        enter => enter.append('text')
          .attr('class', 'frames-bar-chart-label')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'hanging')
          .attr('y', setYScale.range()[1] + mainLabelTopMargin)
          .attr('x', (mainChartWidth - mainSpaceBetweenCharts) / 4)
          .attr('font-size', 12)
          .html(d => d)
      );

    // draw secondary charts
    d3.select('.set-overview-secondary-charts')
      .attr('transform', `translate(${mainChartWidth},0)`);

    d3.select('.set-overview-secondary-charts')
      .selectAll('.secondary-chart-label')
      .data(['No. of frames'])
      .join(
        enter => enter.append('text')
          .attr('class', 'secondary-chart-label')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'hanging')
          .attr('transform', 'rotate(-90)')
          .attr('y', secondaryLabelMarginLeft) // x and y are swapped
          .attr('x', -setYScale.range()[1] / 2)
          .attr('font-size', 12)
          .html(d => d)
      );

    const maxDuration = d3.max(this.localDatasetCopy.map(e => e.parsedData.length))! || 1;

    // setup initial y scale
    const ySecondaryChartScale = d3.scaleLinear()
      .domain([0, maxDuration]) // initial value
      .range([setYScale.bandwidth(), 0]);

    const secondaryChartG = d3.select('.set-overview-secondary-charts')
      .selectAll('.frames-secondary-bar-chart')
      .data(CONSTANTS.datasets)
      .join(
        enter => enter.append('g')
          .attr('class', 'frames-secondary-bar-chart')
          .attr('transform', d => `translate(${secondaryMarginLeft},${setYScale(d)})`)
      );

    // for each set
    secondaryChartG.each((pData, i, nodes) => {
      const setSurgeries = this.localDatasetCopy.filter(e => e.set === pData);
      let meanDuration = d3.mean(setSurgeries.map(e => e.duration)) || 0;

      const xSecondaryChartScales = d3.scaleBand<number>()
        .domain(setSurgeries.map(e => e.spNr))
        .range([0, secondaryChartWidth])
        .padding(.1);

      d3.select(nodes[i])
        .selectAll<SVGSVGElement, SurgeryData>('.set-overview-secondary-rect')
        .data(setSurgeries, k => k.spNr)
        .join(
          enter => enter.append('rect')
            .attr('class', 'set-overview-secondary-rect')
            .attr('y', ySecondaryChartScale(0))
            .on('mousemove', (e, d) => {
              const paddingX = 5;
              const marginY = 5; // y margin from cursor
              const height = 21;
              let [x, y] = d3.pointer(e, d3.select('#set-overview-svg').node());

              let label = d3.select('.set-overview-tooltip')
                .select<SVGTSpanElement>('tspan')
                .text(d.spName);

              let computedMaxWidth = label.node()!.getComputedTextLength();

              // adjust width of the tooltip according to the rendered text width
              d3.select('.set-overview-tooltip')
                .attr('opacity', 1)
                .attr('transform', `translate(${x - (computedMaxWidth + paddingX * 2) / 2}, ${y - height - marginY})`)
                .select('rect')
                .attr('width', computedMaxWidth + paddingX * 2);
            }).on('mouseleave', () => {
              d3.select('.set-overview-tooltip')
                .attr('transform', 'translate(0,0)')
                .attr('opacity', 0);
            })
        ).attr('width', xSecondaryChartScales.bandwidth())
        .attr('x', d => xSecondaryChartScales(d.spNr) || 0)
        .transition()
        .duration(1000)
        .attr('y', d => ySecondaryChartScale(d.duration))
        .attr('height', d => ySecondaryChartScale(0) - ySecondaryChartScale(d.duration))
        .attr('fill', d => {
          if (this.localSelectionCopy.length > 0 && this.localSelectionCopy.map(e => e.object).includes(d.spNr) || this.localSelectionCopy.length === 0) {
            if(d.set) {
              return CONSTANTS.datasetColors(d.set);
            } else {
              throw new Error(`Surgery ${d.spNr} is not assigned to any set`)
            }
          } else {
            return 'lightgray';
          }
        });

      d3.select<SVGGElement, any>(nodes[i] as SVGGElement)
        .call(d3.axisLeft<number>(ySecondaryChartScale)
          .tickValues(ySecondaryChartScale.ticks(3).filter((tick:number) => Number.isInteger(tick)))
          .tickFormat(d3.format('~s')))
        .call(g => g.select(".domain")
          .attr('stroke', 'gray'))
        .call(g => g.selectAll('.tick')
          .select('text')
          .attr('fill', 'gray'))
        .call(g => g.selectAll('.tick')
          .select('line')
          .attr('stroke', 'gray'));

      d3.select(nodes[i])
        .selectAll('.mean-line-g')
        .data([pData])
        .join(
          enter => enter.append('g')
            .attr('class', 'mean-line-g')
        );

        d3.select(nodes[i])
          .select('.mean-line-g')
          .selectAll('.mean-line')
          .data([pData])
          .join(
            enter => enter.append('line')
              .attr('class', 'mean-line')
              .attr('x1', 0)
              .attr('x2', xSecondaryChartScales.range()[1])
              .attr('stroke-width', 1)
              .attr('stroke', 'gray')
              .attr('stroke-dasharray', 2)
          ).transition().duration(1000)
          .attr('y1', ySecondaryChartScale(meanDuration))
          .attr('y2', ySecondaryChartScale(meanDuration));

        d3.select(nodes[i])
          .select('.mean-line-g')
          .selectAll('.mean-value')
          .data([pData])
          .join(
            enter => enter.append('text')
              .attr('class', 'mean-value')
              .attr('fill', 'gray')
              .attr('font-size', 11)
              .attr('text-anchor', 'end')
              .attr('transform', `translate(${xSecondaryChartScales.range()[1]}, ${ySecondaryChartScale(meanDuration) - 2})`)
          ).transition().duration(1000)
          .attr('transform', `translate(${xSecondaryChartScales.range()[1]}, ${ySecondaryChartScale(meanDuration) - 2})`)
          .text(d3.format('.2s')(meanDuration));
    });
  }

  getNrFramesPerSet(data: SurgeryData[]): DataCounterNew<string, number>[] {
    return CONSTANTS.datasets.map(set => {
      return {
        object: set,
        value: data.filter(e => e.set === set).map(e => e.duration).reduce((p, c) => p + c, 0)
      }
    }).filter(e => e.value > 0);
  }

  getNrFilesPerSet(data: SurgeryData[]): DataCounterNew<string, number>[] {
    return CONSTANTS.datasets.map(set => {
      return {
        object: set,
        value: data.filter(e => e.set === set).length
      }
    }).filter(e => e.value > 0);
  }

  private selectionToSurgeryData(selection: DataCounterNew<number, Occurrence[]>[]) {
    return this.localDatasetCopy.filter(e => selection.map(e => e.object).includes(e.spNr));
  }
}
