import {Component, OnInit} from '@angular/core';
import {DataSharingService} from "../service/data-sharing.service";
import {SurgeryData} from "../model/SurgeryData";
import * as d3 from "d3";
import {PieArcDatum} from "d3";
import {CONSTANTS} from "../constants";
import {Transition} from "../model/Transition";
import {Occurrence} from "../model/Occurrence";
import {WordWrap} from "../util/WordWrap";
import {DataCounterNew} from "../model/DataCounterNew";
import {ScaleData} from "../model/ScaleData";
import {DataCounterSelection} from "../model/DataCounterSelection";
import {InstrumentSelectionService} from "../instrument-selection.service";
import {PhaseSelectionService} from "../service/phase-selection.service";

@Component({
  selector: 'app-graph-view',
  templateUrl: './graph-view.component.html',
  styleUrls: ['./graph-view.component.css']
})
export class GraphViewComponent implements OnInit {
  private svgHeight = 0;
  private svgWidth = 0;

  private scaleType = 0;
  private instScaleType = 0;

  private viewTransitionSets = false;
  private localDatasetCopy: SurgeryData[] = [];
  private localPhaseSelection: DataCounterSelection<string, DataCounterNew<string, number>[]>[] = [];
  private globalPhaseSelection: DataCounterSelection<string, DataCounterNew<string, number>[]>[] = [];
  private allPhaseData: DataCounterSelection<string, DataCounterNew<string, number>[]>[] = [];
  private globalInstrumentSelection: DataCounterNew<string, Record<string, string | number>[]>[] = [];
  private allInstrumentData: DataCounterNew<string, Record<string, string | number>[]>[] = [];
  private transitions: DataCounterSelection<Transition, DataCounterNew<string, number>[]>[] = [];


  constructor(private dataSharingService: DataSharingService,
              private instrumentSelectionService: InstrumentSelectionService,
              private phaseSelectionService: PhaseSelectionService) {
  }

  ngOnInit(): void {
    // @ts-ignore
    this.svgWidth = d3.select('#graph-view-svg').node().getBoundingClientRect().width;
    // @ts-ignore
    this.svgHeight = d3.select('#graph-view-svg').node().getBoundingClientRect().height;

    this.dataSharingService.dataset$.subscribe(dataset => {
      this.localDatasetCopy = dataset;
      let dataAsSelection = this.dataToSelection();
      this.allPhaseData = this.selectionToPhaseOccurrences(dataAsSelection);
      this.allInstrumentData = this.selectionToInstrumentData(dataAsSelection);
      this.transitions = this.getTransitions(dataAsSelection);

      // reset all selections
      this.localPhaseSelection = [];

      this.globalPhaseSelection = this.selectionToPhaseOccurrences([]);
      this.globalInstrumentSelection = this.selectionToInstrumentData([]);

      this.drawGraph();
    });


    this.instrumentSelectionService.selection$.subscribe(selection => {
        this.localPhaseSelection = [];
        this.globalPhaseSelection = this.selectionToPhaseOccurrences(selection);
        this.globalInstrumentSelection = this.selectionToInstrumentData(selection);

      if(selection.length > 0) {
        this.transitions = []; // do not show transitions when selection is applied
      } else {
        this.transitions = this.getTransitions(this.dataToSelection())
      }
      // } else {
      //
      //   this.globalPhaseSelection = this.selectionToPhaseOccurrences([]);
      //   this.globalInstrumentSelection = this.selectionToInstrumentData([]);
      //   this.transitions = this.getTransitions(this.dataToSelection());
      //
      // }



      this.drawGraph();
    });

    d3.select('#graph-view-scale-select').on('change', e => {
      this.scaleType = +d3.select(e.currentTarget).property('value');
      this.drawGraph();
    });

    d3.select('#graph-view-inst-scale-select').on('change', e => {
      this.instScaleType = +d3.select(e.currentTarget).property('value');
      this.drawGraph();
    });

    d3.select('#graph-view-set-transitions-checkbox').on('change', e => {
      this.viewTransitionSets = d3.select(e.currentTarget).property('checked');
      this.drawGraph();
    });
  }

  private drawGraph() {
    let phaseData: DataCounterSelection<string, DataCounterNew<string, number>[]>[] = this.globalPhaseSelection.length > 0 ?
      this.globalPhaseSelection : this.allPhaseData;

    let phaseScale = d3.scaleBand()
      .domain(CONSTANTS.phaseMapping.domain())
      .range([0, this.svgWidth]);

    const sideViewHeight = 200;
    const mainViewHeight = this.svgHeight - sideViewHeight;
    const yGraphCenter = mainViewHeight / 2;
    const phaseRadius = Math.min(phaseScale.bandwidth() / 3, 40);
    const phaseInnerRadius = phaseRadius / 2;
    const setTransitionPieRadius = 8;

    // draw background elements
    d3.select('.graph-view-separators')
      .selectAll('.phase-line')
      .data(CONSTANTS.phaseMapping.domain().slice(0, CONSTANTS.phaseMapping.domain().length - 1))
      .join(
        enter => enter.append('line')
          .attr('class', 'phase-line')
          .attr('y1', 0)
          .attr('y2', this.svgHeight)
          .attr('x1', d => (phaseScale(d) || 0) + phaseScale.bandwidth())
          .attr('x2', d => (phaseScale(d) || 0) + phaseScale.bandwidth())
          .attr('stroke-width', 1)
          .attr('stroke', 'darkgray')
      );

    let labelGroups = d3.select('.graph-view-labels')
      .selectAll('.phase-label-g')
      .data(CONSTANTS.phaseMapping.domain())
      .join(
        enter => enter.append('g')
          .attr('class', 'phase-label-g')
          .attr('transform', d => `translate(${(phaseScale(d) || 0) + phaseScale.bandwidth() / 2})`)
      );

    labelGroups.selectAll('.phase-label-nr')
      .data(d => [d])
      .join(
        enter => enter.append('text')
          .attr('class', 'phase-label-nr')
          .attr('font-size', 12)
          .attr('fill', 'black')
          .attr('text-anchor', 'middle')
          .attr('dy', '1em')
          .text(d => d + ".")
      );

    labelGroups.selectAll('.phase-label')
      .data(d => [d])
      .join(
        enter => enter.append('text')
          .attr('class', 'phase-label')
          .attr('font-size', 12)
          .attr('fill', 'black')
          .attr('text-anchor', 'middle')
          .attr('dy', '2.1em')
          .text(CONSTANTS.phaseMapping)
          .call(WordWrap.wrap, phaseScale, 5)
      );

    d3.select('.graph-view-separators')
      .selectAll('.side-line')
      .data([0])
      .join(
        enter => enter.append('line')
          .attr('class', 'side-line')
          .attr('x1', 0)
          .attr('x2', this.svgWidth)
          .attr('y1', mainViewHeight)
          .attr('y2', mainViewHeight)
          .attr('stroke-width', 1)
          .attr('stroke', 'gray')
      );

    // draw transitions
    let maxNrTransitions = d3.max(this.transitions.flatMap(t => d3.sum(t.value.map(e => e.value)))) || 0;

    let transitionScale = d3.scaleLinear()
      .domain([0, maxNrTransitions])
      .range([0, 20]);

    d3.select('.graph-view-links')
      .selectAll<SVGSVGElement, DataCounterSelection<Transition, DataCounterNew<string, number>[]>>('.phase-link')
      .data(this.transitions, k => k.object.start + k.object.end)
      .join(
        enter => enter.append('path')
          .attr('class', d => `phase-link start-${d.object.start} end-${d.object.end}`)
          .attr('stroke', 'gray')
          .attr('fill', 'none')
          .attr('opacity', 0.1)
          .on('mouseover', (e, d) => {
            d3.select(e.currentTarget).attr('opacity', 0.6)
          }).on('mouseout', (e, d) => {
            d3.select(e.currentTarget).attr('opacity', 0.1)
          }).on('click', (e, d) => {
            // update selection objects
            this.globalPhaseSelection = this.selectionToPhaseOccurrences(d.originalData);
            this.globalInstrumentSelection = this.selectionToInstrumentData(d.originalData);
            this.transitions = this.getTransitions(d.originalData);

            this.phaseSelectionService.updateSelection(d.originalData);
            this.drawGraph();
          })
      ).transition().duration(1000)
      .attr('d', d => {
        let startX = (phaseScale(d.object.start) || 0) + phaseScale.bandwidth() / 2;
        let endX = (phaseScale(d.object.end) || 0) + phaseScale.bandwidth() / 2;
        if (d.object.start === "8888") {
          startX = 0 - phaseScale.bandwidth() / 2;
        } else if (d.object.end === '9999') {
          endX = this.svgWidth + phaseScale.bandwidth() / 2;
        }
        return ['M', startX, yGraphCenter, 'A',
          (startX - endX) / 2, ',', // rx
          (startX - endX) / 5, 0, 0, ',', // ry, angle, large-arc-flag
          1, endX, ',', yGraphCenter] // sweep-flag, x, y
          .join(' ')
      }).attr('stroke-width', d => transitionScale(d3.sum(d.value.map(e => e.value))));

    // draw transition sets
    // let setTransitionCounter: DataCounter<Transition, DataCounterNew<string, number>[]>[] = transitionData.map(tr => {
    //   let counter: DataCounterNew<string, number>[] = CONSTANTS.datasets.map(set => ({object: set, value: 0}));
    //
    //   tr.sps.forEach(sp => { // for each sp
    //     let currSet = this.localDatasetCopy.find(t => t.spNr === sp)!.set;
    //
    //     counter.find(e => e.object === currSet)!.value += 1;
    //   });
    //
    //   return {
    //     object: tr,
    //     value: counter
    //   }
    // });

    const transitionPieGen = d3.pie<DataCounterNew<string, number>>()
      .value(d => d.value)
      .sort((a, b) => a.object.localeCompare(b.object));

    const transitionArcGen = d3.arc<PieArcDatum<DataCounterNew<string, number>>>()
      .outerRadius(setTransitionPieRadius)
      .innerRadius(0);

    let transitionPieG = d3.select('.graph-view-links-data')
      .selectAll<SVGSVGElement, DataCounterSelection<Transition, DataCounterNew<string, number>>>('.phase-link-data-g')
      .data(this.transitions, k => k.object.start + k.object.end)
      .join(
        enter => enter.append('g')
          .attr('class', 'phase-link-data-g')
      ).attr('transform', d => {
        const currTransition = d.object;

        let startX = (phaseScale(currTransition.start) || 0) + phaseScale.bandwidth() / 2;
        let endX = (phaseScale(currTransition.end) || 0) + phaseScale.bandwidth() / 2;
        if (currTransition.start === "8888") {

          startX = 0 - phaseScale.bandwidth() / 2;
        } else if (currTransition.end === '9999') {
          endX = this.svgWidth + phaseScale.bandwidth() / 2;
        }

        let x = Math.round((startX + endX) / 2);
        let y = Math.round(yGraphCenter - (endX - startX) / 5);

        // slightly move top left and top right charts to fit on the screen
        if (currTransition.start === '8888' && currTransition.end === phaseScale.domain()[0]) { // transition from the start to the first phase
          x += setTransitionPieRadius;
        } else if (currTransition.end === '9999' && currTransition.start === phaseScale.domain()[phaseScale.domain().length - 1]) { // transition
          x -= setTransitionPieRadius;
        }

        return `translate(${x}, ${y})`;
      })

    transitionPieG.each((pData, i, nodes) => {
      d3.select(nodes[i])
        .selectAll('.phase-link-data')
        .data(transitionPieGen(pData.value))
        .join(
          enter => enter.append('path')
            .attr('class', 'phase-link-data')
        ).on('mouseover', (e, d) => {
        d3.selectAll(`.phase-link.start-${pData.object.start}.end-${pData.object.end}`)
          .transition().duration(200)
          .attr('opacity', 0.6)
      }).on('mouseout', (e, d) => {
        d3.selectAll(`.phase-link.start-${pData.object.start}.end-${pData.object.end}`)
          .transition().duration(200)
          .attr('opacity', 0.1)
      }).on('mousemove', (e, d) => {
        if (this.viewTransitionSets) {
          const paddingX = 5;
          const marginY = 5;
          const height = 66;
          let [x, y] = d3.pointer(e, d3.select('#graph-view-svg').node());

          let startText = pData.object.start === '8888' ? 'start' : pData.object.start;
          let endText = pData.object.end === '9999' ? 'end' : pData.object.end;

          let label = d3.select('.graph-view-phase-tooltip')
            .select<SVGTSpanElement>('tspan')
            .text(`${startText} → ${endText}`);

          let computedMaxWidth = label.node()!.getComputedTextLength();

          CONSTANTS.datasets.forEach(c => {
            let elem = d3.select('.graph-view-phase-tooltip')
              .select<SVGTSpanElement>(`.tooltip-${c}`)
              .text(`${c}: ${d3.format(',')(pData.value.find(e => e.object === c)!.value)}`);

            computedMaxWidth = Math.max(computedMaxWidth, elem.node()!.getComputedTextLength());
          });

          const fullWidth = computedMaxWidth + paddingX * 2;

          // adjust width of the tooltip according to the rendered text width
          d3.select('.graph-view-phase-tooltip')
            .attr('opacity', 1)
            .attr('transform', `translate(${Math.max(Math.min(x - fullWidth / 2, this.svgWidth - fullWidth), 1)}, ${y - height - marginY})`)
            .select('rect')
            .attr('width', fullWidth);
        }
      }).on('mouseleave', () => {
        if (this.viewTransitionSets) {
          d3.select('.graph-view-phase-tooltip')
            .attr('transform', 'translate(0,0)')
            .attr('opacity', 0);
        }
      })
        .attr('opacity', () => this.viewTransitionSets ? 1 : 0)
        .attr('d', d => transitionArcGen(d))
        .attr('fill', d => CONSTANTS.datasetColors(d.data.object));
    });

    //  draw nr of sps per phase
    let maxSpPerPhase = d3.max(phaseData.map(e => e.originalData.length)) || 0;
    let minSpPerPhase = d3.min(phaseData.map(e => e.originalData.length)) || 0;

    d3.select('.graph-view-nodes')
      .selectAll<SVGSVGElement, DataCounterSelection<string, number>>('.phase-node')
      .data(phaseData, k => k.object)
      .join(
        enter => enter.append('circle')
          .attr('class', 'phase-node')
          .attr('cx', d => (phaseScale(d.object) || 0) + phaseScale.bandwidth() / 2)
          .attr('cy', yGraphCenter)
          .attr('r', phaseRadius)
          .attr('alignment-baseline', 'middle')
      ).attr('fill', d => maxSpPerPhase != minSpPerPhase ? d3.interpolateGreys((d.originalData.length - minSpPerPhase) / ((maxSpPerPhase - minSpPerPhase) * 2)) : d3.interpolateGreys(0.5))
      .on('mouseover', (e, d) => {
        d3.selectAll(`.start-${d.object}`)
          .transition().duration(500)
          .attr('opacity', 1);

        d3.selectAll('.pie-element-label')
          .transition().duration(500)
          .attr('opacity', 1);
      }).on('mouseout', (e, d) => {
      d3.selectAll(`.start-${d.object}`)
        .transition().duration(500)
        .attr('opacity', 0.3);

      d3.selectAll('.pie-element-label')
        .transition().duration(500)
        .attr('opacity', 0);
    });

    d3.select('.graph-view-nodes')
      .selectAll<SVGSVGElement, DataCounterSelection<string, number>>('.graph-view-occ')
      .data(phaseData, k => k.object)
      .join(
        enter => enter.append('text')
          .attr('class', 'graph-view-occ')
          .attr('x', d => (phaseScale(d.object) || 0) + phaseScale.bandwidth() / 2)
          .attr('y', yGraphCenter)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#505050')
          .attr('font-weight', 'bold')
          .attr('font-family', 'Helvetica, sans-serif')
          .attr('font-size', 15)
      ).text(d => d.originalData.length);

    // draw phase pie charts
    let setDataMax = d3.max(this.allPhaseData.flatMap(e => d3.sum(e.value.map(s => s.value)))) || 0;

    let pieGen = d3.pie<DataCounterNew<string, number>>()
      .value(d => d.value)
      .sort((a, b) => a.object.localeCompare(b.object));

    let pieGroup = d3.select('.graph-view-nodes')
      .selectAll<SVGSVGElement, DataCounterSelection<string, DataCounterNew<string, number>[]>>('.graph-view-pie')
      .data(phaseData, k => k.object)
      .join(
        enter => enter.append('g')
          .attr('class', 'graph-view-pie')
      ).attr('transform', d => `translate(${(phaseScale(d.object) || 0) + phaseScale.bandwidth() / 2}, ${yGraphCenter})`);

    const arcGen = d3.arc<PieArcDatum<DataCounterNew<string, number>>>()
      .innerRadius(phaseInnerRadius)
      .outerRadius(phaseRadius);

    pieGroup.each((pData, i, nodes) => {

      let pieG = d3.select(nodes[i]).selectAll<SVGSVGElement, DataCounterSelection<string, DataCounterNew<string, number>[]>>('.pie-element-g')
        .data([pData], k => k.object)
        .join(
          enter => enter.append('g')
            .attr('class', 'pie-element-g')
        );

      pieG.selectAll('.pie-element')
        .data(pieGen(pData.value.filter(e => e.value > 0))) // filter datasets that are empty
        .join(
          enter => enter.append('path')
            .attr('class', 'pie-element')
        ).attr('d', arcGen)
        .attr('fill', d => {
          return CONSTANTS.datasetColors(d.data.object)
        });

      d3.select(nodes[i]).selectAll('.pie-element-label')
        .data(d => pieGen(pData.value.filter(e => e.value > 0)))
        .join(
          enter => enter.append('text')
            .attr('class', `pie-element-label phase-${pData.object}`)
        ).attr('font-size', 10)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('transform', d => `translate(${arcGen.centroid(d).map(e => e * 1.7)})`) // todo: temporary solution
        .attr('fill', d => d3.rgb(CONSTANTS.datasetColors(d.data.object)).darker(1).toString())
        .text(d => d3.format('.2s')(d.value))
        .attr('opacity', 0);

      let pieMetaG = d3.select(nodes[i]).selectAll<SVGSVGElement, DataCounterSelection<string, DataCounterNew<string, number>[]>>('.pie-meta-element-g')
        .data([pData], k => k.object)
        .join(
          enter => enter.append('g')
            .attr('class', 'pie-meta-element-g')
        );

      pieMetaG.selectAll<SVGSVGElement, DataCounterSelection<string, DataCounterNew<string, number>[]>>('.pie-meta-element')
        .data([pData], k => k.object)
        .join(
          enter => enter.append('circle')
            .attr('class', 'pie-meta-element')
            .attr('r', phaseRadius)
            .attr('fill-opacity', 0)
            .on('click', (e,d) => {
              let selectedIdx = this.localPhaseSelection.findIndex(s => s.object === pData.object);
              if (selectedIdx === -1) {
                this.localPhaseSelection.push(this.selectionToPhaseOccurrences(this.dataToSelection()).find(s => s.object === pData.object)!);
              } else {
                this.localPhaseSelection.splice(selectedIdx, 1);
              }

              this.globalPhaseSelection = [];
              this.globalInstrumentSelection = [];

              if(this.localPhaseSelection.length > 0) {
                this.transitions = []; // do not show transitions when selection is applied
              } else {
                this.transitions = this.getTransitions(this.dataToSelection())
              }

              this.phaseSelectionService.updateSelection(this.localPhaseSelection.flatMap(e => e.originalData));
              this.drawGraph();
            }).on('mouseover', (e,d) => {
              d3.selectAll(`.pie-element-label.phase-${pData.object}`)
                .transition().duration(200)
                .attr('opacity', 1);

            }).on('mouseout', (e,d) => {
              d3.selectAll(`.pie-element-label.phase-${pData.object}`)
                .transition().duration(200)
                .attr('opacity', 0);
            })
        ).attr('stroke-width', this.localPhaseSelection.find(e => e.object === pData.object) !== undefined ? 3 : 0)
        .attr('stroke', this.localPhaseSelection.find(e => e.object === pData.object) !== undefined ? '#ff6f0a' : 'none')
    });

    // draw phase barchart
    const barChartYScale = d3.scaleLinear()
      .domain([0, setDataMax])
      .range([0, -mainViewHeight / 3]);

    d3.select('.graph-view-phase-barchart')
      .attr('transform', `translate(0, ${mainViewHeight})`)
      .selectAll<SVGSVGElement, DataCounterSelection<string, DataCounterNew<string, number>[]>>('.phase-bar')
      .data(this.allPhaseData, k => k.object)
      .join(
        enter => enter.append('rect')
          .attr('class', 'phase-bar')
          .attr('x', d => phaseScale(d.object) || 0)
          .attr('y', barChartYScale(0))
          .attr('height', 0)
          .attr('width', phaseScale.bandwidth())
        // .attr('opacity', 0.5)
      ).attr('fill', () => {
      if (this.globalPhaseSelection.length > 0) {
        return 'lightgray'
      } else {
        return '#fed9a6';
      }
    }).transition().duration(1000)
      .attr('x', d => phaseScale(d.object) || 0)
      .attr('y', d => barChartYScale(d3.sum(d.value.map(e => e.value))))
      .attr('height', d => barChartYScale(0) - barChartYScale(d3.sum(d.value.map(e => e.value))))
      .attr('width', phaseScale.bandwidth());

    d3.select('.graph-view-phase-barchart')
      .attr('transform', `translate(0, ${mainViewHeight})`)
      .selectAll<SVGSVGElement, DataCounterSelection<string, DataCounterNew<string, number>[]>>('.phase-bar-selected')
      .data(this.globalPhaseSelection, k => k.object)
      .join(
        enter => enter.append('rect')
          .attr('class', d => `phase-bar-selected ${d.object}`)
          .attr('x', d => phaseScale(d.object) || 0)
          .attr('y', barChartYScale(0) )
          .attr('height', 0)
          .attr('width', phaseScale.bandwidth())
          .attr('fill', '#fed9a6')
          // .attr('opacity', 0.5)
      ).transition().duration(1000)
      .attr('x', d => phaseScale(d.object) || 0)
      .attr('y', d => barChartYScale(d3.sum(d.value.map(e => e.value))))
      .attr('height', d => barChartYScale(0) - barChartYScale(d3.sum(d.value.map(e => e.value))))
      .attr('width', phaseScale.bandwidth());


    // add bar chart labels
    const labelMargin = 3;
    d3.select('.graph-view-phase-barchart')
      .selectAll<SVGSVGElement, DataCounterSelection<string, DataCounterNew<string, number>[]>>('.phase-bar-label')
      .data(this.allPhaseData, k => k.object)
      .join(
        enter => enter.append('text')
          .attr('class', d => `phase-bar-label ${d.object}`)
          .attr('x', d => (phaseScale(d.object) || 0) + phaseScale.bandwidth() - labelMargin)
          .attr('font-size', 11)
          .attr('text-anchor', 'end')
      ).attr('fill', () => {
      if (this.globalPhaseSelection.length > 0) {
        return 'lightgray'
      } else {
        return '#a1886b';
      }
    }).text(d => d3.format(',')(d3.sum(d.value.map(e => e.value))))
      .transition().duration(1000)
      .attr('y', d => barChartYScale(d3.sum(d.value.map(e => e.value))) - labelMargin);

    d3.select('.graph-view-phase-barchart')
      .selectAll<SVGSVGElement, DataCounterSelection<string, DataCounterNew<string, number>[]>>('.phase-bar-label-selected')
      .data(this.globalPhaseSelection, k => k.object)
      .join(
        enter => enter.append('text')
          .attr('class', d => `phase-bar-label-selected ${d.object}`)
          .attr('x', d => (phaseScale(d.object) || 0) + labelMargin)
          .attr('y', barChartYScale(0) )
          .attr('font-size', 11)
          .attr('fill', '#a1886b')
      ).text(d => d3.format(',')(d3.sum(d.value.map(e => e.value))))
      .transition().duration(1000)
      .attr('y', d => barChartYScale(d3.sum(d.value.map(e => e.value))) - labelMargin);

    // draw instrument chart
    let instStackGen = d3.stack<Record<string, string | number>>()
      .keys(CONSTANTS.datasets)
      .offset(d3.stackOffsetSilhouette);

    const instYScale = d3.scaleBand()
      .domain(CONSTANTS.instrumentMapping.domain())
      .range([0, sideViewHeight])
      .paddingOuter(0.3)
      .paddingInner(0.1);

    const instYPadding = instYScale.paddingOuter() * instYScale.step() * 2;

    let instXScale: ScaleData<string, d3.ScaleLinear<number, number>>[] = [];
    if (this.instScaleType === 0) {
      let instMaxVal = d3.max(this.allInstrumentData.flatMap(e => e.value.flatMap(r => d3.sum(CONSTANTS.datasets.map(d => r[d] as number))))) || 1;
      instXScale.push({
        id: 'absolute',
        scale: d3.scaleLinear()
          .domain([0, instMaxVal])
          .range([0, phaseScale.bandwidth() - instYPadding])
      });
    } else if (this.instScaleType === 1) {
      CONSTANTS.phaseMapping.domain().forEach(scalePhase => { // for each phase
        let instMaxVal = d3.max(
          this.allInstrumentData.filter(e => e.object === scalePhase)
            .flatMap(phase => phase.value
              .flatMap(inst => d3.sum(CONSTANTS.datasets.map(set => inst[set] as number))))) || 1;

        instXScale.push({
          id: scalePhase,
          scale: d3.scaleLinear()
            .domain([0, instMaxVal])
            .range([0, phaseScale.bandwidth() - instYPadding])
        });
      });
    } else if (this.instScaleType === 2) {
      CONSTANTS.instrumentMapping.domain().forEach(scaleInst => { // for each set
        let instMaxVal = d3.max(
          this.allInstrumentData
            .flatMap(phase => phase.value.filter(inst => inst['instId'] === scaleInst)
              .flatMap(inst => d3.sum(CONSTANTS.datasets.map(d => inst[d] as number))))) || 1;

        instXScale.push({
          id: scaleInst,
          scale: d3.scaleLinear()
            .domain([0, instMaxVal])
            .range([0, phaseScale.bandwidth() - instYPadding])
        });
      });
    } else {
      instStackGen = instStackGen.offset(d3.stackOffsetExpand);

      instXScale.push({
        id: 'expand',
        scale: d3.scaleLinear()
          .domain([0, 1])
          .range([(phaseScale.bandwidth() - instYPadding) / -2, (phaseScale.bandwidth() - instYPadding) / 2])
      });
    }

    const phaseInstG = d3.select('.graph-view-instrument-occurrence')
      .selectAll<SVGSVGElement, DataCounterNew<string, Record<string, string | number>[]>>('.phase-inst-occurrence-g')
      .data(this.allInstrumentData, k => k.object)
      .join(
        enter => enter.append('g')
          .attr('class', 'phase-inst-occurrence-g')
      );

    phaseInstG.each((pPhaseData, i, nodes) => {
      let instG = d3.select(nodes[i])
        .selectAll<SVGSVGElement,  d3.Stack<any, Record<string, string | number>, string>>('.phase-inst-g')
        .data(instStackGen(pPhaseData.value))
        .join(
          enter => enter.append('g')
            .attr('class', 'phase-inst-g')
            .attr('transform', `translate(${(phaseScale(pPhaseData.object) || 0) + phaseScale.bandwidth() / 2}, ${mainViewHeight})`)
            // .attr('fill', d => CONSTANTS.datasetColors(d.key))
        );

      instG.each((pSetData, i, nodes) => {
        d3.select(nodes[i])
          .selectAll<SVGSVGElement, d3.SeriesPoint<Record<string, string | number>>>('.phase-inst')
          .data(pSetData, k => (k.data['instId'] as string) + pSetData.key)
          .join(
            enter => enter.append('rect')
              .attr('class', 'phase-inst')
              .attr('y', d => instYScale(d.data['instId'] as string) || 0)
              .attr('height', instYScale.bandwidth())
              .on('mousemove', (e, d) => {
                if(this.globalInstrumentSelection.length === 0) {
                  const paddingX = 5;
                  const marginY = 5;
                  const height = 66;
                  let [x, y] = d3.pointer(e, d3.select('.graph-view-instrument-chart').node());

                  let label = d3.select('.graph-view-instrument-tooltip')
                    .select<SVGTSpanElement>('tspan')
                    .text(CONSTANTS.instrumentMapping(d.data['instId'] as string));

                  let computedMaxWidth = label.node()!.getComputedTextLength();

                  CONSTANTS.datasets.forEach(c => {
                    let elem = d3.select('.graph-view-instrument-tooltip')
                      .select<SVGTSpanElement>(`.tooltip-${c}`)
                      .text(`${c}: ${d3.format(',')(d.data[c] as number)}`);

                    computedMaxWidth = Math.max(computedMaxWidth, elem.node()!.getComputedTextLength());
                  });

                  const fullWidth = computedMaxWidth + paddingX * 2;

                  // adjust width of the tooltip according to the rendered text width
                  d3.select('.graph-view-instrument-tooltip')
                    .attr('opacity', 1)
                    .attr('transform', `translate(${Math.max(Math.min(x - fullWidth / 2,  this.svgWidth - fullWidth), 1)}, ${y - height - marginY})`)
                    .select('rect')
                    .attr('width', fullWidth);
                }
              }).on('mouseleave', () => {
                if(this.globalInstrumentSelection.length === 0) {
                  d3.select('.graph-view-instrument-tooltip')
                    .attr('transform', 'translate(0,0)')
                    .attr('opacity', 0);
                }
              })
          ).attr('fill', this.globalInstrumentSelection.length > 0 ? 'lightgray' : CONSTANTS.datasetColors(pSetData.key))
          .transition().duration(1000)
          .attr('x', d => {
            let selectedScale;
            if (this.instScaleType == 0 || this.instScaleType == 3) { // absolute scale
              selectedScale = instXScale[0].scale;
            } else if (this.instScaleType == 1) { // phase scale
              selectedScale = instXScale.find(s => s.id === pPhaseData.object)!.scale;
            } else { // instrument scale
              selectedScale = instXScale.find(s => s.id === d.data['instId'])!.scale;
            }
            return selectedScale(d[0])
          }).attr('width', d => {
          let selectedScale;
          if (this.instScaleType == 0 || this.instScaleType == 3) { // absolute scale
            selectedScale = instXScale[0].scale;
          } else if (this.instScaleType == 1) { // phase scale
            selectedScale = instXScale.find(s => s.id === pPhaseData.object)!.scale;
          } else { // instrument scale
            selectedScale = instXScale.find(s => s.id === d.data['instId'])!.scale;
          }
          return selectedScale(d[1]) - selectedScale(d[0])
        })
      })
    });

    const phaseInstSelectedG = d3.select('.graph-view-instrument-occurrence')
      .selectAll('.phase-inst-selection-occurrence-g')
      .data(this.globalInstrumentSelection)
      .join(
        enter => enter.append('g')
          .attr('class', 'phase-inst-selection-occurrence-g')
      );

    phaseInstSelectedG.each((pPhaseData, i, nodes) => {
      let instG = d3.select(nodes[i])
        .selectAll('.phase-inst-selection-g')
        .data(instStackGen(pPhaseData.value))
        .join(
          enter => enter.append('g')
            .attr('class', 'phase-inst-selection-g')
            .attr('fill', d => CONSTANTS.datasetColors(d.key))
        ).attr('transform', `translate(${(phaseScale(pPhaseData.object) || 0) + phaseScale.bandwidth() / 2}, ${mainViewHeight})`);

      instG.each((pSetData, i, nodes) => {
        d3.select(nodes[i])
          .selectAll<SVGSVGElement, d3.SeriesPoint<Record<string, string | number>>>('.phase-inst-selection')
          .data(pSetData, k => k.data['instId'])
          .join(
            enter => enter.append('rect')
              .attr('class', 'phase-inst-selection')
              .attr('y', d => instYScale(d.data['instId'] as string) || 0)
              .attr('height', instYScale.bandwidth())
              .on('mousemove', (e, d) => {
                const paddingX = 5;
                const marginY = 5;
                const height = 65;
                let [x, y] = d3.pointer(e, d3.select('.graph-view-instrument-chart').node());

                let label = d3.select('.graph-view-instrument-tooltip')
                  // .attr('transform', `translate(${Math.max(Math.min(x - 50, this.svgWidth - 101), 1)}, ${y - 65 - 5})`)
                  .attr('opacity', 1)
                  .select<SVGTSpanElement>('tspan')
                  .text(CONSTANTS.instrumentMapping(d.data['instId'] as string));

                let computedMaxWidth = label.node()!.getComputedTextLength();

                CONSTANTS.datasets.forEach(c => {
                  let elem = d3.select('.graph-view-instrument-tooltip')
                    .select<SVGTSpanElement>(`.tooltip-${c}`)
                    .text(`${c}: ${d3.format(',')(d.data[c] as number)}`);

                  computedMaxWidth = Math.max(computedMaxWidth, elem.node()!.getComputedTextLength());
                });

                const fullWidth = computedMaxWidth + paddingX * 2;

                // adjust width of the tooltip according to the rendered text width
                d3.select('.graph-view-instrument-tooltip')
                  .attr('transform', `translate(${Math.max(Math.min(x - fullWidth / 2, this.svgWidth - fullWidth), 1)}, ${y - height - marginY})`)
                  .select('rect')
                  .attr('width', fullWidth);

              }).on('mouseleave', () => {
                d3.select('.graph-view-instrument-tooltip')
                  .attr('transform', 'translate(0,0)')
                  .attr('opacity', 0);

              })
          ).transition().duration(1000)
          .attr('x', d => {
            let selectedScale;
            if (this.instScaleType == 0 || this.instScaleType == 3) { // absolute scale
              selectedScale = instXScale[0].scale;
            } else if (this.instScaleType == 1) { // phase scale
              selectedScale = instXScale.find(s => s.id === pPhaseData.object)!.scale;
            } else { // instrument scale
              selectedScale = instXScale.find(s => s.id === d.data['instId'])!.scale;
            }
            return selectedScale(d[0])
          }).attr('width', d => {
          let selectedScale;
          if (this.instScaleType == 0 || this.instScaleType == 3) { // absolute scale
            selectedScale = instXScale[0].scale;
          } else if (this.instScaleType == 1) { // phase scale
            selectedScale = instXScale.find(s => s.id === pPhaseData.object)!.scale;
          } else { // instrument scale
            selectedScale = instXScale.find(s => s.id === d.data['instId'])!.scale;
          }
          return selectedScale(d[1]) - selectedScale(d[0])
        })
      })
    });

    // let instYScale: ScaleData<string, d3.ScaleRadial<number, number>>[] = [];
    // if(this.instScaleType === 0) {
    //     let instMaxVal = d3.max(instData.flatMap(phase => phase.value.flatMap(set => set.value.flatMap(inst => inst.value)))) || 1;
    //     instYScale.push({
    //       id: 'absolute',
    //       scale: d3.scaleRadial()
    //         .domain([0, instMaxVal])
    //         .range([innerRadius, instSetScale.bandwidth() / 2])
    //     });
    // } else if(this.instScaleType === 1) {
    //   CONSTANTS.phaseMapping.domain().forEach(scalePhase => {
    //     let instMaxVal = d3.max(instData.filter(e =>  e.object === scalePhase).flatMap(phase => phase.value.flatMap(set => set.value.flatMap(inst => inst.value)))) || 1;
    //     instYScale.push({
    //       id: scalePhase,
    //       scale: d3.scaleRadial()
    //         .domain([0, instMaxVal])
    //         .range([innerRadius, instSetScale.bandwidth() / 2])
    //     });
    //   });
    // } else {
    //   CONSTANTS.datasets.forEach(scaleSet => {
    //     let instMaxVal = d3.max(instData.flatMap(phase => phase.value.filter(e =>  e.object === scaleSet).flatMap(set => set.value.flatMap(inst => inst.value)))) || 1;
    //     instYScale.push({
    //       id: scaleSet,
    //       scale: d3.scaleRadial()
    //         .domain([0, instMaxVal])
    //         .range([innerRadius, instSetScale.bandwidth() / 2])
    //     });
    //   });
    // }







    // let instData = this.getInstrumentData();
    //
    // // let instPieGen = d3.pie<DataCounterNew<string, number>>()
    // //   .value(d => d.value)
    // //   .sort((a,b) => a.object.localeCompare(b.object));
    //
    // const instSetScale = d3.scaleBand()
    //   .domain(CONSTANTS.datasets)
    //   .range([0, sideViewHeight])
    //   .paddingOuter(0.3);
    //
    // const instXScale = d3.scaleBand()
    //   .domain(CONSTANTS.instrumentMapping.domain())
    //   .range([0, 2 * Math.PI])
    //   // .padding(0.1);
    //
    //
    //
    // // let phaseG = d3.select('.graph-view-instrument-chart')
    // //   .selectAll('.graph-view-instrument-g')
    // //   .data(instData)
    // //   .join(
    // //     enter => enter.append('g')
    // //       .attr('class', 'graph-view-instrument-g')
    // //   );
    // //
    // // phaseG.each((pPhaseData, i, nodes) => {
    // //   let instG = d3.select(nodes[i])
    // //     .selectAll('.graph-view-instrument-g-g')
    // //     .data(pPhaseData.value)
    // //     .join(
    // //       enter => enter.append('g')
    // //         .attr('transform', d => `translate(${(phaseScale(pPhaseData.object) || 0) + phaseScale.bandwidth() / 2}, ${mainViewHeight + (instSetScale(d.object) || 0)})`)
    // //         .attr('class', '.graph-view-instrument-g-g')
    // //     );
    // //
    // //
    // //   instG.selectAll('.graph-view-instrument')
    // //     .data(d => instPieGen(d.value))
    // //     .join(
    // //       enter => enter.append('path')
    // //         .attr('d', d => d3.arc<PieArcDatum<DataCounterNew<string, number>>>()
    // //           .innerRadius(0)
    // //           .outerRadius(instSetScale.bandwidth() / 2)(d))
    // //         .attr('fill', d => CONSTANTS.datasetColors(d.data.object))
    // //     )
    // //
    // // })
    //
    // const innerRadius = phaseRadius - phaseInnerRadius;
    //
    // let instYScale: ScaleData<string, d3.ScaleRadial<number, number>>[] = [];
    // if(this.instScaleType === 0) {
    //     let instMaxVal = d3.max(instData.flatMap(phase => phase.value.flatMap(set => set.value.flatMap(inst => inst.value)))) || 1;
    //     instYScale.push({
    //       id: 'absolute',
    //       scale: d3.scaleRadial()
    //         .domain([0, instMaxVal])
    //         .range([innerRadius, instSetScale.bandwidth() / 2])
    //     });
    // } else if(this.instScaleType === 1) {
    //   CONSTANTS.phaseMapping.domain().forEach(scalePhase => {
    //     let instMaxVal = d3.max(instData.filter(e =>  e.object === scalePhase).flatMap(phase => phase.value.flatMap(set => set.value.flatMap(inst => inst.value)))) || 1;
    //     instYScale.push({
    //       id: scalePhase,
    //       scale: d3.scaleRadial()
    //         .domain([0, instMaxVal])
    //         .range([innerRadius, instSetScale.bandwidth() / 2])
    //     });
    //   });
    // } else {
    //   CONSTANTS.datasets.forEach(scaleSet => {
    //     let instMaxVal = d3.max(instData.flatMap(phase => phase.value.filter(e =>  e.object === scaleSet).flatMap(set => set.value.flatMap(inst => inst.value)))) || 1;
    //     instYScale.push({
    //       id: scaleSet,
    //       scale: d3.scaleRadial()
    //         .domain([0, instMaxVal])
    //         .range([innerRadius, instSetScale.bandwidth() / 2])
    //     });
    //   });
    // }
    //
    // // phase
    // let instOccG = d3.select('.graph-view-instrument-occurrence')
    //   .selectAll('.graph-view-instrument-occurrence-g')
    //   .data(instData)
    //   .join(
    //     enter => enter.append('g')
    //       .attr('class', 'graph-view-instrument-occurrence-g')
    //   );
    //
    // // fixme: change to update pattern
    // d3.select('.graph-view-chart')
    //   .append('line')
    //   .attr('x1', 0)
    //   .attr('x2', this.svgWidth)
    //   .attr('y1', mainViewHeight)
    //   .attr('y2', mainViewHeight)
    //   .attr('stroke-width', 1)
    //   .attr('stroke', 'gray')
    //
    // instOccG.each((pPhaseData, i, nodes) => {
    //   let setG = d3.select(nodes[i])
    //     .selectAll('.graph-view-instrument-occurrence-set')
    //     .data(pPhaseData.value)
    //     .join(
    //       enter => enter.append('g')
    //         .attr('class', 'graph-view-instrument-occurrence-set')
    //         .attr('fill', d => CONSTANTS.datasetColors(d.object))
    //         .attr('transform', d => `translate(${(phaseScale(pPhaseData.object) || 0) + phaseScale.bandwidth() / 2}, ${mainViewHeight + (instSetScale(d.object) || 0) + instSetScale.bandwidth() / 2})`)
    //     );
    //
    //   setG.each((pSetData, i, nodes) => {
    //     d3.select(nodes[i])
    //       .selectAll('.background-circle')
    //       .data([pSetData])
    //       .join(
    //         enter => enter.append('circle')
    //           .attr('class', 'background-circle')
    //           .attr('r', innerRadius)
    //           .attr('opacity', 0.3)
    //           // .attr('stroke-width' , 1)
    //           // .attr('stroke', 'lightgray')
    //       )
    //
    //
    //     d3.select(nodes[i])
    //       .selectAll('.graph-view-instrument-occurrence-rect')
    //       .data(pSetData.value)
    //       .join(
    //         enter => enter.append('path')
    //           .attr('class', 'graph-view-instrument-occurrence-rect')
    //           // .attr('x', d => instXScale(d.object) || 0)
    //           // .attr('width', instXScale.bandwidth())
    //       )
    //     //   .attr('y', d => {
    //     //   if (this.instScaleType == 0) {
    //     //     return instYScale[0].scale(d.value);
    //     //   } else if (this.instScaleType == 1) {
    //     //     return instYScale.find(s => s.id === pPhaseData.object)!.scale(d.value);
    //     //   } else {
    //     //     return instYScale.find(s => s.id === pSetData.object)!.scale(d.value);
    //     //   }
    //     // })
    //       .attr('d', d => {
    //         let rScale: d3.ScaleRadial<number, number>;
    //         if (this.instScaleType == 0) {
    //           rScale = instYScale[0].scale;
    //         } else if (this.instScaleType == 1) {
    //           rScale = instYScale.find(s => s.id === pPhaseData.object)!.scale;
    //         } else {
    //           rScale = instYScale.find(s => s.id === pSetData.object)!.scale;
    //         }
    //         return d3.arc<DataCounterNew<string, number>>()
    //           .innerRadius(innerRadius)
    //           .outerRadius(d => rScale(d.value))
    //           .startAngle(d => instXScale(d.object) || 0)
    //           .endAngle(d => (instXScale(d.object) || 0) + instXScale.bandwidth())
    //           .padAngle(0)
    //           .padRadius(0)(d)
    //       })
    //       .on('mousemove', (e, d) => {
    //         let [x, y] = d3.pointer(e, d3.select('.graph-view-instrument-chart').node());
    //         d3.select('.graph-view-instrument-tooltip')
    //           .select('text')
    //           .attr('transform', `translate(${x+5}, ${y})`)
    //           .text(CONSTANTS.instrumentMapping(d.object))
    //       }).on('mouseleave', () => {
    //       d3.select('.graph-view-instrument-tooltip').select('text').text(null)
    //     });
    //   });
    // });

  }

  private getTransitions(data: DataCounterNew<number, Occurrence[]>[]): DataCounterSelection<Transition, DataCounterNew<string, number>[]>[] {
    let result: DataCounterSelection<Transition, DataCounterNew<string, number>[]>[] = [];

    data.forEach(sp => { // for each surgery in the entire dataset
      let spObj = this.localDatasetCopy.find(s => s.spNr === sp.object)!;

      sp.value.forEach(occ => { // for each occurrence
        let startIdx = spObj.parsedData.findIndex(f => f.Frame === occ.start)!;
        let endIdx = spObj.parsedData.findIndex(f => f.Frame === occ.end)!;

        let currPhase = spObj.parsedData[endIdx]?.Phase;
        let nextPhase = spObj.parsedData[endIdx + 1]?.Phase;

        if(startIdx === 0) { // start transition
          let resultEntry = result.find(t => t.object.start === '8888' && t.object.end === currPhase + "");
          if (resultEntry !== undefined) { // transition already present in the result object
            resultEntry.value.find(s => s.object === spObj.set)!.value++;

            let spEntry = resultEntry.originalData.find(l => l.object === sp.object);
            if (spEntry === undefined) {
              resultEntry.originalData.push(sp)
            }
          } else {
            result.push({
              object: {start: "8888", end: currPhase + ""},
              value: CONSTANTS.datasets.map(d => ({object: d, value: spObj.set === d ? 1 : 0})),
              originalData: [sp]
            });
          }
        }

        if (currPhase !== nextPhase) { // transition found
          let nextOccurr;
          // check if this is the last or the first occurrence
          if(nextPhase === undefined) {
            nextPhase = 9999;
          } else {
            let nextFrame = spObj.parsedData[endIdx + 1]?.Frame;
            nextOccurr = sp.value.find(t => t.start === nextFrame);
          }

          if (nextPhase === 9999 || nextOccurr !== undefined) { // transition present in the provided data

            let resultEntry = result.find(t => t.object.start === currPhase + "" && t.object.end === nextPhase + "");
            if (resultEntry !== undefined) { // transition already present in the result object
              resultEntry.value.find(s => s.object === spObj.set)!.value++;

              let spEntry = resultEntry.originalData.find(l => l.object === sp.object);
              if (spEntry === undefined) {
                resultEntry.originalData.push(sp)
              }
            } else {
              result.push({
                object: {start: currPhase + "", end: nextPhase + ""},
                value: CONSTANTS.datasets.map(d => ({object: d, value: spObj.set === d ? 1 : 0})),
                originalData: [sp]
              });
            }
          }
        }
      });
    });

    return result;
  }

  /**
   * Convert selection to data that this view requires
   * @param selection
   * @private
   */
  private selectionToPhaseOccurrences(selection: DataCounterNew<number, Occurrence[]>[]): DataCounterSelection<string, DataCounterNew<string, number>[]>[] {
    let result: DataCounterSelection<string, DataCounterNew<string, number>[]>[] = [];

    selection.forEach(spSelection => { // for each selected surgery
      let spObj = this.localDatasetCopy.find(e => e.spNr === spSelection.object)!;

      spSelection.value.forEach(selOcc => { // for each occurrence of the selected surgery

        CONSTANTS.phaseMapping.domain().forEach(phaseId => { // for each phase
          let overlapOcc: Occurrence[] = [];
          let overlapCounter = 0;

          spObj.phaseIndex[phaseId].forEach(phaseOcc => { // for each phase occurrence in the original data
            let overlapStart = Math.max(selOcc.start, phaseOcc.start);
            let overlapEnd = Math.min(selOcc.end, phaseOcc.end);

            if (overlapStart <= overlapEnd) { // intervals overlap?
              overlapOcc.push({start: overlapStart, end: overlapEnd});
              overlapCounter += spObj.parsedData.filter(row => row.Frame >= overlapStart && row.Frame <= overlapEnd).length;
            }
          });

          // store
          if (overlapCounter > 0) {
            let resultEntry = result.find((e => e.object === phaseId));
            if (resultEntry === undefined) { // create new result entry
              let newEntry = {
                object: phaseId,
                value: CONSTANTS.datasets.map(d => ({object: d, value: d === spObj.set ? overlapCounter : 0})),
                originalData: [{object: spObj.spNr, value: overlapOcc}]
              }

              result.push(newEntry);
            } else { // result entry already exists
              let setEntry = resultEntry.value.find(e => e.object === spObj.set)!;
              setEntry.value += overlapCounter;

              let spEntry = resultEntry.originalData.find(s => s.object === spSelection.object)
              if (spEntry === undefined) {
                resultEntry.originalData.push({object: spObj.spNr, value: overlapOcc});
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

  private selectionToInstrumentData(selection: DataCounterNew<number, Occurrence[]>[]): DataCounterNew<string, Record<string, string | number>[]>[] {
    let result: DataCounterNew<string, Record<string, string | number>[]>[] = []; // counter per phase

    selection.forEach(spSelection => { // for each selected surgery
      let spObj = this.localDatasetCopy.find(e => e.spNr === spSelection.object)!;

      spSelection.value.forEach(selOcc => { // for each occurrence of the selected surgery

        CONSTANTS.phaseMapping.domain().forEach(phaseId => { // for each phase

          spObj.phaseIndex[phaseId].forEach(phaseOcc => { // for each phase occurrence in the original data
            let phaseOverlapStart = Math.max(selOcc.start, phaseOcc.start);
            let phaseOverlapEnd = Math.min(selOcc.end, phaseOcc.end);

            if (phaseOverlapStart <= phaseOverlapEnd) { // phase overlap?
              // dataObj.value.push({start: overlapStart, end: overlapEnd});

              CONSTANTS.instrumentMapping.domain().forEach(instId => { // for each instrument
                let instOverlapOcc: Occurrence[] = [];
                let instOverlapCounter = 0;

                spObj.instIndex[instId].forEach(instOcc => { // for each instrument occurrence
                  let instOverlapStart = Math.max(instOcc.start, phaseOverlapStart);
                  let instOverlapEnd = Math.min(instOcc.end, phaseOverlapEnd);

                  if (instOverlapStart <= instOverlapEnd) { // instrument overlap?
                    instOverlapOcc.push({start: instOverlapStart, end: instOverlapEnd});
                    instOverlapCounter += spObj.parsedData.filter(row => row.Frame >= instOverlapStart && row.Frame <= instOverlapEnd).length;
                  }
                });

                // store
                if (instOverlapCounter > 0) {
                  let resultEntry = result.find((e => e.object === phaseId));
                  if (resultEntry === undefined) { // create new result entry

                    let newValue: Record<string, string | number> = {
                      instId: instId
                    }

                    CONSTANTS.datasets.forEach(d => d === spObj.set ? newValue[d] = instOverlapCounter : newValue[d] = 0);
                    result.push({object: phaseId, value: [newValue]});
                  } else { // result entry already exists
                    let instEntry = resultEntry.value.find(i => i['instId'] === instId);

                    if (instEntry === undefined) {
                      let newValue: Record<string, string | number> = {
                        instId: instId
                      }

                      CONSTANTS.datasets.forEach(d => d === spObj.set ? newValue[d] = instOverlapCounter : newValue[d] = 0);

                      resultEntry.value.push(newValue)
                    } else {
                      if(spObj.set) {
                        (instEntry[spObj.set] as number) += instOverlapCounter;
                      } else {
                        throw new Error(`Surgery ${spObj.spName} is not assigned to any set`)
                      }
                    }
                  }
                }
              });
            }
          });
        });
      });
    });
    return result;
  }

  private dataToSelection(): DataCounterNew<number, Occurrence[]>[] {
    return this.localDatasetCopy.map(e => ({object: e.spNr, value: CONSTANTS.phaseMapping.domain().flatMap(l => e.phaseIndex[l])}));
  }
}
