import * as d3 from 'd3';
import {BaseType} from 'd3';

export class WordWrap {
  public static wrap(selection: d3.Selection<SVGTextElement, string, BaseType, unknown>, scale: d3.ScaleBand<string>, yPadding?: number) {
    selection.each((d, i, nodes) => { // for each text element
      let text = d3.select(nodes[i]),
        words = text.text().split(/\s+/).reverse(),
        word,
        line: string[] = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y") || 0,
        dy = parseFloat(text.attr("dy")),
        width = scale.bandwidth() - (yPadding || 0),
        tspan = text.text(null) // empty tspan element
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", dy + "em");

      while (word = words.pop()) { // for every word in the text element
        line.push(word); // append word to the line
        tspan.text(line.join(" ")); // tspan contains all words from the line separated by whitespace
        let tspanNode = tspan.node();

        if (tspanNode !== null && tspanNode.getComputedTextLength() >= width && line.length > 1) { // tspan exceeds bandwidth
          line.pop(); // remove the last word from the line
          tspan.text(line.join(" ")); // tspan contains all words from the line separated by whitespace (except the last one)
          line = [word]; // next line now contains previously removed word
          tspan = text.append("tspan") // add new tspan element with the previously removed word
            .attr("x", 0)
            .attr("y", y)
            .attr("dy", ++lineNumber * lineHeight + dy + "em")
            .text(word);
        }
      }
    });
  }
}
