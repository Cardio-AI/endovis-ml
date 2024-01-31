import {Component, OnInit} from '@angular/core';
import {SurgeryData} from "../model/SurgeryData";
import {DataSharingService} from "../service/data-sharing.service";
import * as d3 from "d3";
import {PieArcDatum} from "d3";
import {DataCounter} from "../model/DataCounter";
import {CONSTANTS} from "../constants";
import {Occurrence} from "../model/Occurrence";
import {DataCounterNew} from "../model/DataCounterNew";
import {InstCooccurrenceNode} from "../model/InstCooccurrenceNode";
import {DataCounterSelection} from "../model/DataCounterSelection";
import {SetMethods} from "../util/SetMethods";
import {PhaseSelectionService} from "../service/phase-selection.service";
import {InstrumentSelectionService} from "../service/instrument-selection.service";
import {WordWrap} from "../util/WordWrap";

@Component({
  selector: 'app-inst-coocurrence',
  templateUrl: './inst-coocurrence.component.html',
  styleUrls: ['./inst-coocurrence.component.css']
})
export class InstCoocurrenceComponent implements OnInit {

  private svgHeight = 0;
  private svgWidth = 0;
  private localDatasetCopy: SurgeryData[] = [];
  private allInstCooccurrences: DataCounterSelection<Set<string>, DataCounterNew<string, number>[]>[] = [];
  private allInstOccurrences: DataCounter<DataCounter<number>[]>[] = [];

  private globalSelection: DataCounterSelection<Set<string>, DataCounterNew<string, number>[]>[] = [];

  private individualScales = false;
  private viewUnused = true;
  private viewIdle = true;
  private highlight = false;

  private selectedCooccurrences: DataCounterSelection<Set<string>, DataCounterNew<string, number>[]>[] = [];

  private clickedInst: string[] = []; // track clicked instrument labels

  constructor(private dataSharingService: DataSharingService, private phaseSelectionService: PhaseSelectionService, private instrumentSelectionService: InstrumentSelectionService) {
  }

  ngOnInit(): void {
    // @ts-ignore
    this.svgWidth = d3.select('#instrument-cooccurrence-svg').node().getBoundingClientRect().width;
    // @ts-ignore
    this.svgHeight = d3.select('#instrument-cooccurrence-svg').node().getBoundingClientRect().height;

    d3.select('#instrument-cooccurrence-idle-checkbox').on('change', e => {
      this.viewIdle = d3.select(e.currentTarget).property('checked');
      this.drawGraph();
    });

    d3.select('#instrument-cooccurrence-unused-checkbox').on('change', e => {
      this.viewUnused = d3.select(e.currentTarget).property('checked');
      this.drawGraph();
    });

    d3.select('#instrument-cooccurrence-scale-checkbox').on('change', e => {
      this.individualScales = d3.select(e.currentTarget).property('checked');
      this.drawGraph();
    });

    d3.select('#instrument-cooccurrence-highlight-checkbox').on('change', e => {
      this.highlight = d3.select(e.currentTarget).property('checked');
      this.drawGraph();
    });

    // get dataset from the set-overview component
    this.dataSharingService.dataset$.subscribe(dataset => {
      this.localDatasetCopy = dataset;

      const allOccurrences = this.getAllOccurrences();
      this.allInstCooccurrences = allOccurrences.filter(e => e.object.size > 1);
      this.allInstOccurrences = this.occurrenceToBarchartData(allOccurrences);

      // reset all selections when the dataset is updated
      this.clickedInst = [];
      this.selectedCooccurrences = [];
      this.globalSelection = [];
      this.drawGraph();
    });

    // get phase selections
    this.phaseSelectionService.selection$.subscribe(selection => {
      this.selectedCooccurrences = []; // remove all local selections
      this.clickedInst = [];
      this.globalSelection = this.selectionToAllOccurrences(selection);
      this.drawGraph();
    });
  }

  private drawGraph() {
    const barChartHeight = 35;
    const chartPadding = 60;
    const radius = this.svgWidth / 2.3 - barChartHeight - chartPadding;
    const nodeRadius = 10;

    // get all necessary data
    const allOccurrences = this.globalSelection.length > 0 ? this.globalSelection : this.getAllOccurrences(); // take global selection if present, default dataset otherwise
    const instCooccurrences = allOccurrences.filter(e => e.object.size > 1); // represent nodes in the view
    const instSingleOccurrences = this.occurrenceToBarchartData(allOccurrences);

    const dataMaxVal = d3.max(instSingleOccurrences.flatMap(e => e.value.map(d => d.value))) || 0;

    const angle = Math.PI * 2 / instSingleOccurrences.length;

    d3.select('.instrument-cooccurrence-chart')
      .attr('transform', `translate(${this.svgWidth/ 2}, ${this.svgHeight / 2})`);

    let instCooccurrNodes = instCooccurrences.map((e: InstCooccurrenceNode<Set<string>, DataCounterNew<string, number>[]>) => {
      let coord = this.instSetToCentroidCoord(e.object, instSingleOccurrences, angle, radius);
      e.x = coord[0];
      e.y = coord[1];
      return e;
    })

    // radial lines
    d3.select('.instrument-nodes-g')
      .selectAll('.instrument-line')
      .data(instSingleOccurrences)
      .join(
        enter => enter.append('line')
          .attr('class', 'instrument-line')
          .attr('stroke', 'lightgray')
          .attr('stroke-width', 1)
          .attr('fill', '#fff1a8')
      ).attr('x1', (_, i) => this.instIdxToXCoord(i, angle, radius))
      .attr('x2', (_, i) => this.instIdxToXCoord(i + 1, angle, radius))
      .attr('y1', (_, i) => this.instIdxToYCoord(i, angle, radius))
      .attr('y2', (_, i) => this.instIdxToYCoord(i + 1, angle, radius));

    // barcharts
    const barMargin = 0;
    const maxBarWidth = radius * 2 * Math.cos((Math.PI - angle) / 2) - barMargin; // fixme: this formula is not correct

    const setBarYScale = d3.scaleBand()
      .domain(CONSTANTS.datasets)
      .range([barChartHeight, 0]);

    let setBarXScale: d3.ScaleLinear<number, number>[];
    if(this.individualScales) {
      const individualInstVal = instSingleOccurrences.map(e => d3.max(e.value.map(d => d.value)) || 1);

      setBarXScale = individualInstVal.map(v => d3.scaleLinear()
        .domain([0, v])
        .range([0, maxBarWidth]))
    } else {
      setBarXScale = [d3.scaleLinear()
        .domain([0, dataMaxVal])
        .range([0, maxBarWidth])];
    }

    let instG = d3.select('.instrument-nodes-g')
      .selectAll<SVGSVGElement, DataCounterNew<string, DataCounterNew<string, number>[]>>('.instrument-node-g')
      .data(instSingleOccurrences, k => k.object)
      .join(
        enter => enter.append('g')
          .attr('class', 'instrument-node-g')
          .attr('transform', (d, i) => `translate(${Math.round(this.instIdxToXCoord(this.findIdx(instSingleOccurrences, d.object), angle, radius))} ${Math.round(this.instIdxToYCoord(this.findIdx(instSingleOccurrences, d.object), angle, radius))}) rotate(${angle * this.findIdx(instSingleOccurrences, d.object) * 180 / Math.PI})`)
      ).transition().duration(1000)
      .attr('opacity', d => this.highlightOpacity(d.value))
      .attr('transform', (d, i) => `translate(${Math.round(this.instIdxToXCoord(this.findIdx(instSingleOccurrences, d.object), angle, radius))} ${Math.round(this.instIdxToYCoord(this.findIdx(instSingleOccurrences, d.object), angle, radius))}) rotate(${angle * this.findIdx(instSingleOccurrences, d.object) * 180 / Math.PI})`);

    instG.each((pData, i, nodes) => {
      // d3.select(nodes[i])
      //   .selectAll('.instrument-node-background')
      //   .data([pData])
      //   .join(
      //     enter => enter.append('rect')
      //       .attr('class', 'instrument-node-background')
      //       .attr('fill','lightgray')
      //       .attr('x', -1/2 * maxBarWidth)
      //       .attr('y', -barChartHeight)
      //       .attr('width', maxBarWidth)
      //       .attr('height', barChartHeight)
      //       .attr('opacity', 0.3)
      //   );

      // draw bar chart
      // d3.select(nodes[i])
      //   .selectAll('.instrument-node-set')
      //   .data(pData.value)
      //   .join(
      //     enter => enter.append('rect')
      //       .attr('class', 'instrument-node-set')
      //       .attr('fill', d => CONSTANTS.datasetColors(d.object))
      //       .attr('height', setBarYScale.bandwidth())
      //       .attr('x', 0)
      //       .attr('y', d => (setBarYScale(d.object) || 0) - barChartHeight)
      //   ).transition().duration(1000)
      //   .attr('x', d => this.individualScales ? -1 / 2 * setBarXScale[i](d.value) : -1 / 2 * setBarXScale[0](d.value))
      //   .attr('width', d => this.individualScales ? setBarXScale[i](d.value) : setBarXScale[0](d.value));


      d3.select(nodes[i])
        .selectAll('.instrument-node-set')
        .data(pData.value)
        .join(
          enter => enter.append('rect')
            .attr('class', 'instrument-node-set')
            .attr('height', setBarYScale.bandwidth())
            .attr('x', 0)
            .attr('y', d => (setBarYScale(d.object) || 0) - barChartHeight)
        ).transition().duration(1000)
        .attr('fill', d => this.selectedCooccurrences.length > 0 ? 'lightgray' : CONSTANTS.datasetColors(d.object))
        .attr('x', d => this.individualScales ? -1 / 2 * setBarXScale[this.findIdx(instSingleOccurrences, pData.object)](d.value) : -1 / 2 * setBarXScale[0](d.value))
        .attr('width', d => this.individualScales ? setBarXScale[this.findIdx(instSingleOccurrences, pData.object)](d.value) : setBarXScale[0](d.value));

      // draw bar chart values
      d3.select(nodes[i])
        .selectAll('.instrument-node-set-label')
        .data(pData.value)
        .join(
          enter => enter.append('text')
            .attr('class', 'instrument-node-set-label')
            .attr('x', 0)
            .attr('y', d => (setBarYScale(d.object) || 0) - barChartHeight + setBarYScale.bandwidth() / 2)
            // .attr('width', d => setBarXScale(d.value))
            // .attr('height', setBarYScale.bandwidth())
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', 11)
            .attr('opacity', 0)
            .attr('fill', d => d3.color(CONSTANTS.datasetColors(d.object))!.darker(1).toString())
            .text(d => d3.format('.2s')(d.value))
            // .call(WordWrap.wrap, 15, 5)
        )
    });

    // create a group for each co-occurrence
    let selectedData = this.occurrenceToBarchartData(this.selectedCooccurrences);

    let selectedInstG = d3.select('.instrument-selected-nodes-g')
      .selectAll<SVGSVGElement, DataCounter<DataCounter<number>[]>>('.instrument-selected-node-g')
      .data(selectedData, k => k.object)
      .join(
        enter => enter.append('g')
          .attr('class', 'instrument-selected-node-g')
          .attr('transform', (d, i) => `translate(${Math.round(this.instIdxToXCoord(this.findIdx(instSingleOccurrences, d.object), angle, radius))} ${Math.round(this.instIdxToYCoord(this.findIdx(instSingleOccurrences, d.object), angle, radius))}) rotate(${angle * this.findIdx(instSingleOccurrences, d.object) * 180 / Math.PI})`)
      ).transition().duration(1000)
      .attr('transform', (d, i) => `translate(${Math.round(this.instIdxToXCoord(this.findIdx(instSingleOccurrences, d.object), angle, radius))} ${Math.round(this.instIdxToYCoord(this.findIdx(instSingleOccurrences, d.object), angle, radius))}) rotate(${angle * this.findIdx(instSingleOccurrences, d.object) * 180 / Math.PI})`);

    selectedInstG.each((pData, i, nodes) => {
      // draw bar chart
      d3.select(nodes[i])
        .selectAll('.instrument-node-selected-set')
        .data(pData.value)
        .join(
          enter => enter.append('rect')
            .attr('class', 'instrument-node-selected-set')
            .attr('fill', d => CONSTANTS.datasetColors(d.object))
            .attr('height', setBarYScale.bandwidth())
            .attr('x', 0)
            .attr('y', d => (setBarYScale(d.object) || 0) - barChartHeight)
        ).transition().duration(1000)
        .attr('x', d => this.individualScales ? -1 / 2 * setBarXScale[this.findIdx(instSingleOccurrences, pData.object)](d.value) : -1 / 2 * setBarXScale[0](d.value))
        .attr('width', d => this.individualScales ? setBarXScale[this.findIdx(instSingleOccurrences, pData.object)](d.value) : setBarXScale[0](d.value));
    });

    const labelMargin = 5;

    d3.select('.instrument-labels-g')
      .selectAll<SVGSVGElement, DataCounter<DataCounter<number>[]>>('.instrument-label')
      .data(instSingleOccurrences, k => k.object)
      .join(
        enter => enter.append('text')
          .attr('class', 'instrument-label')
          .attr('font-size', 12)
          .style('cursor', 'pointer')
          .attr('transform', (_, i) => `translate(${Math.round(this.instIdxToXCoord(i, angle, radius + barChartHeight + labelMargin))} ${Math.round(this.instIdxToYCoord(i, angle, radius + barChartHeight + labelMargin))})`)
          .text(d => CONSTANTS.instrumentMapping(d.object))
          // .attr('dy', (d, i) => {
          //   if (angle * i < Math.PI / 2 || angle * i > 2 * Math.PI * 0.75) {
          //     return "-1.1em"
          //   } else {
          //     return 0
          //   }
          // })
          .call(WordWrap.wrap, 1000, 5)
          .on('click', (e, d) => {
            let selectionCandidates:DataCounterSelection<Set<string>, DataCounterNew<string, number>[]>[] = [];
            if (this.clickedInst.includes(d.object)) { // unselect
              this.clickedInst = this.clickedInst.filter(e => e !== d.object);
              if(this.clickedInst.length > 0) { // re-select if other instruments still selected
                let subset = new Set(this.clickedInst);
                selectionCandidates = this.getAllOccurrences().filter(e => SetMethods.isSubset(e.object, subset));
              }
            } else { // select
              if (e.shiftKey) { // co-occurrences
                this.clickedInst = [d.object]; // save clicked label
                selectionCandidates = this.getAllOccurrences().filter(e => e.object.size > 1 && e.object.has(d.object));
              } else if (e.altKey) { // occurrences
                this.clickedInst = [d.object]; // save clicked label
                selectionCandidates = this.getAllOccurrences().filter(e => e.object.size == 1 && e.object.has(d.object));
              } else if (e.ctrlKey) { // AND filter
                this.clickedInst.push(d.object); // save clicked label
                if(this.clickedInst.length === 1) {
                  selectionCandidates = this.getAllOccurrences().filter(e => e.object.has(d.object));
                } else {
                  let subset = new Set(this.clickedInst);
                  selectionCandidates = this.selectedCooccurrences.filter(e => SetMethods.isSubset(e.object, subset));
                }
              } else { // occurrences and co-occurrences
                this.clickedInst = [d.object]; // save clicked label
                selectionCandidates = this.getAllOccurrences().filter(e => e.object.has(d.object));
              }
            }
            this.selectedCooccurrences = []; // reset selection

            if(selectionCandidates.length > 0) {
              selectionCandidates.forEach(c => this.selectedCooccurrences.push(c)); // add selected items
            } else {
              this.selectedCooccurrences = [];
              this.clickedInst = [];
            }

            this.globalSelection = [];
            this.instrumentSelectionService.updateSelection(this.selectedCooccurrences.flatMap(e => e.originalData)); // update other components
            this.drawGraph();
          })
      ).attr('fill', d => this.clickedInst.includes(d.object) ? '#ff6f0a' : 'black')
      .transition().duration(1000)
      .attr('transform', (_, i) => `translate(${Math.round(this.instIdxToXCoord(i, angle, radius + barChartHeight + labelMargin))} ${Math.round(this.instIdxToYCoord(i, angle, radius + barChartHeight + labelMargin))})`)
      .attr('text-anchor', (d, i) => {
        if (angle * i === 0 || Math.abs(angle * i - Math.PI) < 0.01) {
          return 'middle';
        } else if (angle * i > Math.PI) {
          return 'end';
        } else {
          return 'start';
        }
      })
      .attr('alignment-baseline', (d, i) => {
        if (angle * i === 0) {
          return 'baseline';
        } else if (Math.abs(angle * i - Math.PI) < 0.01) {
          return 'hanging';
        } else {
          return 'central';
        }
      }).attr('opacity', d => this.highlightOpacity(d.value));


    // apply force simulation
    d3.forceSimulation<InstCooccurrenceNode<Set<string>, DataCounterNew<string, number>[]>>(instCooccurrNodes)
      .force('radial', d3.forceRadial<InstCooccurrenceNode<Set<string>, DataCounterNew<string, number>[]>>(radius / 2).strength(0.01))
      .force('collision', d3.forceCollide<InstCooccurrenceNode<Set<string>, DataCounterNew<string, number>[]>>()
        .radius(nodeRadius * 2))
      .tick(100)
      .stop();

    this.updateCircles(instCooccurrNodes, instSingleOccurrences, angle, radius, nodeRadius);

    // d3.select('.instrument-nodes-g')
    //   .selectAll('.instrument-text')
    //   .data(data)
    //   .join(
    //     enter => enter.append('text')
    //       .attr('class', 'instrument-text')
    //       .attr('x', (d, i) => Math.sin(Math.PI + (angle * i)) * radius)
    //       .attr('y', (d, i) => Math.cos(Math.PI + (angle * i)) * radius)
    //       .attr('font-size', 11)
    //       .attr('font-family', 'Arial')
    //       .attr('text-anchor', 'middle')
    //       .attr('dominant-baseline', 'middle')
    //       .text(d => CONSTANTS.instrumentMapping(d.object))
    //   );
  }

  /**
   * Convert occurrence data to the format that is used in this view
   * @private
   */
  private getAllOccurrences() {
    let result: DataCounterSelection<Set<string>, DataCounterNew<string, number>[]>[] = [];

    this.localDatasetCopy.forEach(sp => { // for each surgery
      sp.occIndex.forEach(instOccur => { // for each co-occurrence
        let resEntry = result.find(e => SetMethods.setEquality(e.object, instOccur.object));
        if (resEntry !== undefined) { // occurrence already present in the result object
          let setEntry = resEntry.value.find(e => e.object === sp.set)!;

          // calculate the number of frames
          instOccur.value.forEach(occ => { // for each occurrence
            setEntry.value += sp.parsedData.filter(row => row.Frame >= occ.start && row.Frame <= occ.end).length;
          });

          // attach original frames that will be used for selections
          resEntry.originalData.push({object: sp.spNr, value: instOccur.value});
        } else { // add new occurrence to the result object
          let newResEntry: DataCounterSelection<Set<string>, DataCounterNew<string, number>[]> = {
            object: instOccur.object,
            value: CONSTANTS.datasets.map(set => ({object: set, value: 0})),
            originalData: [{object: sp.spNr, value: instOccur.value}]
          }

          let setEntry = newResEntry.value.find(e => e.object === sp.set)!;
          instOccur.value.forEach(occ => {
            setEntry.value += sp.parsedData.filter(row => row.Frame >= occ.start && row.Frame <= occ.end).length;
          });

          result.push(newResEntry);
        }
      });
    });
    return result;
  }

  /**
   * Convert occurrence data to barchart data format
   * @param occurData
   * @private
   */
  private occurrenceToBarchartData(occurData: DataCounterNew<Set<string>, DataCounterNew<string, number>[]>[]): DataCounter<DataCounter<number>[]>[] {
    let result: DataCounter<DataCounter<number>[]>[] = [];

    let iterObj = CONSTANTS.instrumentMapping.domain();

    // remove idle node
    if (!this.viewIdle) {
      iterObj = iterObj.filter(e => e !== CONSTANTS.instrumentMappingInverse('Idle'));
    }

    iterObj.forEach(instId => { // for each instrument
      let dataCounter: DataCounter<number>[] = [];

      CONSTANTS.datasets.forEach(set => { // for each dataset
        const data = occurData.filter(e => e.object.has(instId)); // get all co-occurrences that contain this instruments

        let counter = 0;
        data.forEach(cooccurr => { // for each set
          counter += cooccurr.value.find(e => e.object === set)!.value;
        });

        dataCounter.push({object: set, value: counter});
      });

      result.push({object: instId, value: dataCounter});
    });

    return result;
  }

  /**
   * Convert generic selection object consisting of surgery IDs and
   * occurrence intervals to occurrence object that are used in this view.
   * @param selection generic selection object
   * @private
   */
  private selectionToAllOccurrences(selection: DataCounterNew<number, Occurrence[]>[]) {
    let result: DataCounterSelection<Set<string>, DataCounterNew<string, number>[]>[] = [];

    selection.forEach(spSelection => { // for each surgery in the generic selection object
      let spObj = this.localDatasetCopy.find(e => e.spNr === spSelection.object)!;

      spSelection.value.forEach(selOcc => { // for each occurrence of the selected surgery

        spObj.occIndex.forEach(instSet => { // for each instrument co-occurrence in the original surgery
          let overlapOcc: Occurrence[] = [];
          let overlapCounter = 0;

          instSet.value.forEach(instOcc => { // for each occurrence of instrument co-occurrence in the original data
            let overlapStart = Math.max(selOcc.start, instOcc.start);
            let overlapEnd = Math.min(selOcc.end, instOcc.end);

            if (overlapStart <= overlapEnd) { // intervals overlap?
              overlapOcc.push({start: overlapStart, end: overlapEnd});
              overlapCounter += spObj.parsedData.filter(row => row.Frame >= overlapStart && row.Frame <= overlapEnd).length;
            }
          });

          // store
          if (overlapCounter > 0) {
            let resEntry = result.find(u => SetMethods.setEquality(u.object, instSet.object));
            if (resEntry === undefined) { // create new result entry
              let newEntry = {
                object: instSet.object,
                value: CONSTANTS.datasets.map(s => ({object: s, value: s === spObj.set ? overlapCounter : 0})),
                originalData: [{object: spObj.spNr, value: overlapOcc}]
              }

              result.push(newEntry);
            } else { // result entry already exists
              let setEntry = resEntry.value.find(l => l.object === spObj.set)!;
              setEntry.value += overlapCounter;

              let spEntry = resEntry.originalData.find(s => s.object === spObj.spNr);
              if (spEntry === undefined) {
                resEntry.originalData.push({object: spObj.spNr, value: overlapOcc});
              } else {
                spEntry.value.push(...overlapOcc);
              }
            }
          }
        });
      });
    });
    return result;
  }

  private findIdx(data: DataCounterNew<string, DataCounterNew<string, number>[]>[], instId: string) {
    return data.findIndex(e => e.object === instId);
  }

  private instIdxToCoord(instIdx: number, angle: number, radius: number): [number, number] {
    return [this.instIdxToXCoord(instIdx, angle, radius),
      this.instIdxToYCoord(instIdx, angle, radius)];
  }

  private instIdxToXCoord(instIdx: number, angle: number, radius: number) {
    return Math.round(Math.cos((angle * instIdx) - Math.PI /2 ) * radius);
  }

  private instIdxToYCoord(instIdx: number, angle: number, radius: number) {
    return Math.round(Math.sin( (angle * instIdx) - Math.PI / 2) * radius); // Math.PI * 2 / data.length
  }

  private instSetToCentroidCoord(instSet: Set<string>, data: DataCounterNew<string, DataCounterNew<string, number>[]>[], angle: number, radius: number) {
    let points: [number, number][] = [...instSet].map(instId => {
      return this.instIdxToCoord(this.findIdx(data, instId), angle, radius);
    });

    if(points.length === 1){
      return points[0]
    } else if(points.length === 2) {
      return [(points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2];
    }

    let polygonPoints = this.pointsToPolygon(points);
    return d3.polygonCentroid(polygonPoints);
  }

  private pointsToPolygon(points: [number, number][]): [number, number][] {
    let result = d3.polygonHull(points);
    if(result !== null) {
      return result;
    } else {
      return [];
    }
  }

  private updateCircles(instCooccurrNodes: InstCooccurrenceNode<Set<string>, DataCounterNew<string, number>[]>[], data: DataCounterNew<string, DataCounterNew<string, number>[]>[], angle:number, radius: number, nodeRadius: number) {

    let pieGroups = d3.select('.instrument-nodes-pie-g')
      .selectAll<SVGSVGElement, InstCooccurrenceNode<Set<string>, DataCounterNew<string, number>[]>>('.instrument-cooccurr-pie-g')
      .data(instCooccurrNodes, k => [...k.object].sort((a,b) => +a - +b).join(''))
      .join(
        enter => enter.append('g')
          .attr('class', 'instrument-cooccurr-pie-g')
      ).transition().duration(1000)
      .attr('opacity', d => this.highlightOpacity(d.value));


    pieGroups.each((pData, i, nodes) => {

      let pieGen = d3.pie<DataCounterNew<string, number>>()
        .value(d => d.value)
        .sort((a, b) => a.object.localeCompare(b.object));

      let arcGen = d3.arc<PieArcDatum<DataCounterNew<string, number>>>()
        .innerRadius(0)
        .outerRadius(nodeRadius);

      // draw co-occurrence nodes
      d3.select(nodes[i])
        .selectAll<SVGSVGElement, DataCounterNew<string, number>>('.instrument-cooccurr-set')
        .data(pieGen(pData.value.filter(e => e.value !== 0))) // filter empty sets
        .join(
          enter => enter.append('path')
            .attr('class', `instrument-cooccurr-set`)
            .attr('transform', `translate(${pData.x || 0} ${pData.y || 0})`),
          update => update.attr('transform', `translate(${pData.x || 0} ${pData.y || 0})`)
        ).attr('d', arcGen)
        .attr('fill', d => CONSTANTS.datasetColors(d.data.object));
    });

    let metaGroups = d3.select('.instrument-nodes-meta-g')
      .selectAll<SVGSVGElement, InstCooccurrenceNode<Set<string>, DataCounterNew<string, number>[]>>('.instrument-cooccurr-meta-g')
      .data(instCooccurrNodes, k => [...k.object].sort((a,b) => +a - +b).join(''))
      .join(
        enter => enter.append('g')
          .attr('class', 'instrument-cooccurr-meta-g')
      ).transition().duration(1000)
      .attr('opacity', d => this.highlightOpacity(d.value));

    metaGroups.each((pData, i, nodes) => {
      // meta nodes for event listeners
      d3.select(nodes[i])
        .selectAll('.instrument-meta-node')
        .data([pData])
        .join(
          enter => enter.append('circle')
            .attr('class', 'instrument-meta-node')
            .attr('r', nodeRadius)
            .attr('fill-opacity', 0)
        ).on('mouseover', (e, d) => {
        d3.selectAll(`.edge.${[...pData.object].map(p => `n${p}`).join('-')}`)
          .transition().duration(200)
          .attr('stroke', 'black')
          // .attr('opacity', 1)
          .attr('stroke-width', 3);
      }).on('mouseout', () => {
        let edges = d3.selectAll(`.edge.${[...pData.object].map(p => `n${p}`).join('-')}`);
        let edgesTransition = edges.transition().duration(200);
        if (!edges.attr('class').includes("clicked")) {
          edgesTransition
            .attr('stroke-width', 1)
            .attr('stroke', 'lightgray');
        } else {
          edgesTransition.attr('stroke', 'gray');
        }
      }).on('mousemove', (e, d) => {
        const paddingX = 5;
        const marginY = 5;
        const height = 66;
        let [x, y] = d3.pointer(e, d3.select('.instrument-cooccurrence-chart').node());

        let label = d3.select('.instrument-cooccurrence-tooltip')
          .select<SVGTSpanElement>('tspan')
          .text(`${[...pData.object].map(CONSTANTS.instrumentMapping).join(', ')}`);

        let computedMaxWidth = label.node()!.getComputedTextLength();

        CONSTANTS.datasets.forEach(c => {
          let elem = d3.select('.instrument-cooccurrence-tooltip')
            .select<SVGTSpanElement>(`.tooltip-${c}`)
            .text(`${c}: ${d3.format(',')(d.value.find(e => e.object === c)!.value)}`);

          computedMaxWidth = Math.max(computedMaxWidth, elem.node()!.getComputedTextLength());
        });

        // adjust width of the tooltip according to the rendered text width
        d3.select('.instrument-cooccurrence-tooltip')
          .attr('opacity', 1)
          .attr('transform', `translate(${x - (computedMaxWidth + paddingX * 2) / 2}, ${y - height - marginY})`)
          .select('rect')
          .attr('width', computedMaxWidth + paddingX * 2);
      }).on('mouseleave', () => {
        d3.select('.instrument-cooccurrence-tooltip')
          .attr('transform', `translate(${-this.svgWidth / 2}, ${-this.svgHeight / 2})`)
          .attr('opacity', 0);
      }).on('click', (e, d) => {
        let selectedIdx = this.selectedCooccurrences.findIndex(s => SetMethods.setEquality(s.object, pData.object));
        if (selectedIdx === -1) {
          this.selectedCooccurrences.push(this.getAllOccurrences().find(s => SetMethods.setEquality(s.object, pData.object))!);
        } else {
          this.selectedCooccurrences.splice(selectedIdx, 1);
        }
        this.globalSelection = [];
        this.instrumentSelectionService.updateSelection(this.selectedCooccurrences.flatMap(e => e.originalData));

        this.drawGraph();
      }).attr('stroke-width', this.selectedCooccurrences.find(e => SetMethods.setEquality(e.object, pData.object)) !== undefined ? 2 : 0)
        .attr('stroke', this.selectedCooccurrences.find(e => SetMethods.setEquality(e.object, pData.object)) !== undefined ? '#ff6f0a' : 'none')
        .attr('cx', pData.x || 0)
        .attr('cy', pData.y || 0);
    });

    let lineG = d3.select('.instrument-lines-g')
      .selectAll<SVGSVGElement, InstCooccurrenceNode<Set<string>, DataCounterNew<string, number>[]>>('.instrument-line-g')
      .data(instCooccurrNodes, k => [...k.object].sort((a, b) => +a - +b).join(''))
      .join(
        enter => enter.append('g')
          .attr('class', 'instrument-line-g')
      ).transition().duration(1000)
      .attr('opacity', d => this.highlightOpacity(d.value));

    lineG.each((pData, i, nodes) => {
      // draw connection lines
      d3.select(nodes[i])
        .selectAll<SVGSVGElement, Set<string>>('.edge')
        .data(pData.object)
        .join(
          enter => enter.append('line')
            .attr('class', `edge ${[...pData.object].map(p => `n${p}`).join('-')}`)
            .attr('x1', d => this.instIdxToXCoord(this.findIdx(data, d), angle, radius))
            .attr('x2', pData.x || 0)
            .attr('y1', d => this.instIdxToYCoord(this.findIdx(data, d), angle, radius))
            .attr('y2', pData.y || 0)
            .attr('stroke', 'lightgray')
            .attr('stroke-width', 1)
            .attr('opacity', 0.4),
          update => update.classed("clicked", this.selectedCooccurrences.find(e => SetMethods.setEquality(e.object, pData.object)) !== undefined)
            .attr('x1', d => this.instIdxToXCoord(this.findIdx(data, d), angle, radius))
            .attr('x2', pData.x || 0)
            .attr('y1', d => this.instIdxToYCoord(this.findIdx(data, d), angle, radius))
            .attr('y2', pData.y || 0)
            .transition().duration(1000)
            .attr('stroke-width', this.selectedCooccurrences.find(e => SetMethods.setEquality(e.object, pData.object)) !== undefined ? 3 : 1)
            .attr('opacity', this.selectedCooccurrences.find(e => SetMethods.setEquality(e.object, pData.object)) !== undefined ? 0.4 : 0.4)
            .attr('stroke', this.selectedCooccurrences.find(e => SetMethods.setEquality(e.object, pData.object)) !== undefined ? 'gray' : 'lightgray')

        );

      // draw co-occurrence degree
      d3.select(nodes[i])
        .selectAll('.instrument-cooccurr-degree')
        .data(pData.object)
        .join(
          enter => enter.append('path')
            .attr('class', `instrument-cooccurr-degree`)
            .attr('fill', 'lightgray')
            .attr('transform', `translate(${pData.x || 0} ${pData.y || 0})`)
            .attr('d', d3.arc<string>()
              .innerRadius(nodeRadius)
              .outerRadius(nodeRadius + 2)
              .startAngle(d => Math.PI / 2 + Math.atan2(this.instIdxToYCoord(this.findIdx(data, d), angle, radius) - (pData.y || 0), this.instIdxToXCoord(this.findIdx(data, d), angle, radius) - (pData.x || 0)) - Math.PI * 0.05)
              .endAngle(d => Math.PI / 2 + Math.atan2(this.instIdxToYCoord(this.findIdx(data, d), angle, radius) - (pData.y || 0), this.instIdxToXCoord(this.findIdx(data, d), angle, radius) - (pData.x || 0)) + Math.PI * 0.05)),
          update => update.attr('transform', `translate(${pData.x || 0} ${pData.y || 0})`)
            .attr('d', d3.arc<string>()
              .innerRadius(nodeRadius)
              .outerRadius(nodeRadius + 2)
              .startAngle(d => Math.PI / 2 + Math.atan2(this.instIdxToYCoord(this.findIdx(data, d), angle, radius) - (pData.y || 0), this.instIdxToXCoord(this.findIdx(data, d), angle, radius) - (pData.x || 0)) - Math.PI * 0.05)
              .endAngle(d => Math.PI / 2 + Math.atan2(this.instIdxToYCoord(this.findIdx(data, d), angle, radius) - (pData.y || 0), this.instIdxToXCoord(this.findIdx(data, d), angle, radius) - (pData.x || 0)) + Math.PI * 0.05))
        )
    });
  }

  private highlightOpacity(d: DataCounterNew<string, number>[]) {
    if (this.highlight && d.find(e => e.object === 'train')!.value === 0 && d3.sum(d.map(e => e.value)) > 0 || !this.highlight) {
      return 1;
    } else {
      return 0.2;
    }
  }


}
