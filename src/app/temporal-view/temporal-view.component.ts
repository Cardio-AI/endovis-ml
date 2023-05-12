import {Component, OnInit} from '@angular/core';
import {DataSharingService} from "../service/data-sharing.service";
import {SurgeryData} from "../model/SurgeryData";
import {Observable} from "rxjs";
import * as d3 from "d3";
import {SeriesPoint} from "d3";
import {CONSTANTS} from "../constants";
import {DataCounter} from "../model/DataCounter";
import {StreamgraphData} from "../model/StreamgraphData";
import {ExpandScale} from "../util/ExpandScale";
import {ExpandService} from "../service/expand.service";

@Component({
  selector: 'app-temporal-view',
  templateUrl: './temporal-view.component.html',
  styleUrls: ['./temporal-view.component.css']
})
export class TemporalViewComponent implements OnInit {

  private localDatasetCopy: SurgeryData[] = [];
  datasetObservable$: Observable<SurgeryData[]>;

  private svgHeight = 0;
  private svgWidth = 0;

  private viewType = 0;

  private temporalScaleType = 0;
  private classScaleType = 0;
  private expandedItem: string | undefined;

  constructor(private dataSharingService: DataSharingService, private expandService: ExpandService) {
    this.datasetObservable$ = this.dataSharingService.dataset$;
  }

  ngOnInit(): void {
    // @ts-ignore
    this.svgWidth = d3.select('#temporal-view-svg').node().getBoundingClientRect().width;
    // @ts-ignore
    this.svgHeight = d3.select('#temporal-view-svg').node().getBoundingClientRect().height;

    d3.select('#temporal-view-select').on('change',  (e) => {
      this.viewType = +d3.select(e.currentTarget).property('value');
        this.drawPhasesChart();
        this.appendDynamicListeners();
    });

    d3.select('#temporal-scale-select').on('change',  (e) => {
      this.temporalScaleType = +d3.select(e.currentTarget).property('value');
      this.drawPhasesChart();
    });

    d3.select('#temporal-class-scale-select').on('change',  (e) => {
      this.classScaleType = +d3.select(e.currentTarget).property('value');
      this.drawPhasesChart();
    });

    this.dataSharingService.dataset$.subscribe(dataset => {
      this.localDatasetCopy = dataset;
      this.drawPhasesChart();
      this.appendDynamicListeners();
    });
  }

  private drawPhasesChart() {
    const maxDuration = d3.max(this.localDatasetCopy.map(sp => sp.phaseData[sp.phaseData.length - 1].frame)) || 0;

    // Set up scales
    let xSecScale = d3.scaleLinear()
      .range([0, this.svgWidth])
      .domain([0, maxDuration]); // maybe get x pos instead?

    let xSecScaleArr = this.localDatasetCopy.map(sp => {
      return {
        id: sp.spNr,
        scale: d3.scaleLinear()
          .range([0, this.svgWidth])
          .domain([0, sp.phaseData[sp.phaseData.length - 1].frame])
      }
    });

    let discPixDomain = d3.range(xSecScale.range()[0], xSecScale.range()[1]).map(String);

    // Set up scales
    const pixelToSecs = d3.scaleBand()
      .domain(discPixDomain)
      .range([xSecScale.domain()[0], xSecScale.domain()[1]]);

    const pixelToSecsArr = xSecScaleArr.map(e => {
        return {
          id: e.id,
          scale:
            d3.scaleBand()
              .domain((d3.range(e.scale.range()[0], e.scale.range()[1])).map(String))
              .range([e.scale.domain()[0], e.scale.domain()[1]])
        }
      })

    let alldata:DataCounter<StreamgraphData[]>[] = [];

    let nrNonEmptyDatasets = d3.sum(CONSTANTS.datasets.map(datasetLabel => this.localDatasetCopy.some(sp => sp.set === datasetLabel) ? 1 : 0));

    let iterObj;
    if(this.viewType === 0) {
      iterObj = CONSTANTS.phaseMapping.domain();
    } else {
      iterObj = CONSTANTS.instrumentMapping.domain();
    }

    iterObj.forEach(obj => { // for each phase

      const phaseData: StreamgraphData[] = [];

      pixelToSecs.domain().forEach(x => { // for each pixel

        const datasetData:StreamgraphData = {x: x, train: 0, validation: 0, test: 0};

        CONSTANTS.datasets.forEach(datasetLabel => { // for each dataset

          // Filter for only the sps corresponding to the current setname
          const spsFiltered = this.localDatasetCopy.filter(sp => sp.set === datasetLabel);

          let secCount = 0;

          if (spsFiltered.length > 0) {
            // Go across all sps corresponding to the current setname
            spsFiltered.forEach(sp => {
              // For each surgery...
              // Get the start and end sec corresponding to pixel x
              const startSec = this.temporalScaleType == 1 ? (pixelToSecsArr.find(e => e.id === sp.spNr)!.scale(x) || 0) : (pixelToSecs(x) || 0);
              const endSec = this.temporalScaleType == 1 ? (pixelToSecsArr.find(e => e.id === sp.spNr)!.scale(x) || 0) + pixelToSecsArr.find(e => e.id === sp.spNr)!.scale.bandwidth() : (pixelToSecs(x) || 0) + pixelToSecs.bandwidth();

              // Go across all pixels and count for each for how many percent out of the number of secs for this pixel the phase was turned on
              let nrSecsOn = 0;

              let occObj = this.viewType === 0 ? sp.phaseIndex[obj] : sp.instIndex[obj]

              occObj.forEach(occInfo => {
                // Get the first and last sec which are relevant for the range
                const firstSec = d3.max([startSec, occInfo.start]) || 0;
                const lastSec = d3.min([endSec, occInfo.end]) || 0;
                if (lastSec > firstSec) nrSecsOn += lastSec - firstSec;
              });
              // Return the fraction of secs where the phase was turned on as compared to the total number of secs in the range
              secCount += nrSecsOn / (endSec - startSec);
            });
            // Normalize to value between 0 and 1
            secCount /= this.classScaleType == 1 ? spsFiltered.length * nrNonEmptyDatasets : this.localDatasetCopy.length; // Do it different in case of instrument, but still within the highlightSet loop and not for the yScaleElement in general
          }
          // @ts-ignore
          datasetData[datasetLabel] = secCount;
        });
        phaseData.push(datasetData)
      });
      alldata.push({object: obj, value: phaseData});
    });

    // visualize
    // Setup y scales

    let yScaleModule = new ExpandScale()
      .setDomain(this.viewType === 0 ? CONSTANTS.phaseMapping.domain() : CONSTANTS.instrumentMapping.domain())
      .setRange([0, this.svgHeight])
      .padding(0.1);

    if(this.expandedItem) {
      yScaleModule = yScaleModule.setExpandItem(this.expandedItem);
    }

    let yScaleElement = d3.scaleLinear()
      .domain([-0.5, 0.5])
      .range([yScaleModule.bandwidth(), 0]);

    // stack data
    const stackedData: DataCounter<d3.Series<StreamgraphData, string>[]>[] = alldata.map(e => {
      return {
        object: e.object,
        value: d3.stack<StreamgraphData>()
          .offset(d3.stackOffsetSilhouette) // stackOffsetSilhouette or stackOffsetExpand
          .keys(CONSTANTS.datasets)(e.value)
      }
    });

    // calculate expanded data values
    let expandedMaxVal = 0;
    if(this.expandedItem !== undefined) {
      let phaseData = alldata.find(phase => phase.object === this.expandedItem);
      let phaseStackedData = stackedData.find(phase => phase.object === this.expandedItem);
      // alldata = alldata.filter(phase => phase.object !== this.expandedItem);

      let dataExpanded = CONSTANTS.datasets.map(set => {
        return {
          object: set,
          value: d3.stack<StreamgraphData>()
            .offset(d3.stackOffsetSilhouette) // stackOffsetSilhouette or stackOffsetExpand
            .keys([set])(phaseData!.value)
        }
      });

      // for each set
      CONSTANTS.datasets.map(set => {
        let phaseSetStackedIdx = phaseStackedData!.value.findIndex(e => e.key === set);
        let phaseSetStackedExpandedData = dataExpanded.find(e => e.object === set)!.value[0]
        phaseStackedData!.value[phaseSetStackedIdx] = phaseSetStackedExpandedData;

        expandedMaxVal = Math.max(expandedMaxVal, d3.max(phaseSetStackedExpandedData.map(e => e[1])) || 0);
      });
    }


    let yScaleElementExpanded: d3.ScaleBand<string>;
    let yExpandedMultiples: d3.ScaleLinear<number, number>;
    if(this.expandedItem !== undefined) {
      yScaleElementExpanded = d3.scaleBand()
        .domain(CONSTANTS.datasets)
        .range([yScaleModule.bandwidth(this.expandedItem), 0])
        .paddingInner(0.05);

      yExpandedMultiples = d3.scaleLinear()
        .domain([-expandedMaxVal, expandedMaxVal])
        .range([yScaleElementExpanded.bandwidth(), 0]);
    }

    // d3.select('.stream-axis-g')
    //   .selectAll<SVGSVGElement, DataCounter<d3.Series<StreamgraphData, string>[]>>('.stream-axis')
    //   .data(stackedData, k => k.object)
    //   .join(
    //     enter => enter.append('line')
    //       .attr('class', 'stream-axis')
    //       .attr('x1', 0)
    //       .attr('x2', this.svgWidth)
    //       .attr('y1', d => (yScaleModule.scale(d.object) || 0) + yScaleModule.bandwidth(d.object) / 2)
    //       .attr('y2', d => (yScaleModule.scale(d.object) || 0) + yScaleModule.bandwidth(d.object) / 2)
    //       .attr('stroke', 'gray')
    //       .attr('stroke-width', 2)
    //       .attr('opacity', 0.4),
    //     update => update.transition().duration(1000).attr('x1', 0)
    //       .attr('x2', this.svgWidth)
    //       .attr('y1', d => (yScaleModule.scale(d.object) || 0) + yScaleModule.bandwidth(d.object) / 2)
    //       .attr('y2', d => (yScaleModule.scale(d.object) || 0) + yScaleModule.bandwidth(d.object) / 2)
    //   );

    let gPaths = d3.select('.stream-chart-g')
      .selectAll<SVGSVGElement, DataCounter<d3.Series<StreamgraphData, string>[]>>(`.phase-path-g`)
      .data(stackedData, k => k.object)
      .join(
        enter => enter.append('g')
          .attr('class', d => `phase-path-g ${d.object}`)
          .style('fill', (d) => CONSTANTS.datasetColors(d.object)) // fixme: this does not work
          // .style('stroke', (d) => d3.color(CONSTANTS.datasetColors(d.object))?.darker().formatHex() || 0)
          .attr('transform', d => `translate(0,${yScaleModule.scale(d.object)})`),
        update => update.transition().duration(1000)
          .attr('transform', d => `translate(0,${yScaleModule.scale(d.object)})`)
      );

    gPaths.each( (d, i, nodes) => {
      d3.select(nodes[i])
        .selectAll<SVGSVGElement, DataCounter<d3.Series<StreamgraphData, string>[]>>('.phase-path')
        .data(d.value)
        .join(
          enter => enter.append('path')
            .attr('class', 'phase-path')
            // .attr('opacity', 0.5)
            .attr('stroke-width', 1)
            .attr('stroke', 'darkgray')
            .attr('d', (arr,i) =>
              d3.area<SeriesPoint<StreamgraphData>>()
                .x(e => +e.data.x)
                .y0(e => this.expandedItem === d.object ? (yScaleElementExpanded(CONSTANTS.datasets[i]) || 0) + (yExpandedMultiples(0) || 0) : yScaleElement(0))
                .y1(e => this.expandedItem === d.object ? (yScaleElementExpanded(CONSTANTS.datasets[i]) || 0) + (yExpandedMultiples(0) || 0): yScaleElement(0))
                (arr)
            )
            .attr('fill', d => CONSTANTS.datasetColors(d.key))
        ).transition().duration(1000)
        .attr("d", (arr,i) => d3.area<SeriesPoint<StreamgraphData>>()
          .x(e => +e.data.x)
          .y0(e => this.expandedItem === d.object ? (yScaleElementExpanded(CONSTANTS.datasets[i]) || 0) + (yExpandedMultiples(e[0]) || 0) : yScaleElement(e[0]))
          .y1(e => this.expandedItem === d.object ? (yScaleElementExpanded(CONSTANTS.datasets[i]) || 0) + (yExpandedMultiples(e[1]) || 0) : yScaleElement(e[1]))
          (arr)
        );
    });

    d3.select('.stream-label-g')
      .selectAll<SVGSVGElement, DataCounter<d3.Series<StreamgraphData, string>[]>>('.stream-label')
      .data(stackedData, k => k.object)
      .join(
        enter => enter.append('text')
          .attr('class', 'stream-label')
          .attr('transform', d => `translate(0,${yScaleModule.scale(d.object)})`)
          .attr('font-size', 11)
          .attr('fill', 'gray')
          .attr('dominant-baseline', 'hanging')
          .text(d => this.viewType === 0 ? CONSTANTS.phaseMapping(d.object) : CONSTANTS.instrumentMapping(d.object) || '0'),
        update => update.transition().duration(1000)
          .attr('transform', d => `translate(0,${yScaleModule.scale(d.object)})`)
          .text(d => this.viewType === 0 ? CONSTANTS.phaseMapping(d.object) : CONSTANTS.instrumentMapping(d.object) || '0')
      )
  }

  private appendDynamicListeners() {
    d3.selectAll('.stream-label').on('click',  (e) => {
      let clickedLabel = d3.select<SVGSVGElement, DataCounter<d3.Series<StreamgraphData, string>>>(e.currentTarget).datum().object;
      if(this.expandedItem === clickedLabel) {
        this.expandedItem = undefined;
      } else {
        this.expandedItem = clickedLabel;
      }

      this.expandService.updateExpandedItem(this.expandedItem);
      this.drawPhasesChart();
    });
  }
}
