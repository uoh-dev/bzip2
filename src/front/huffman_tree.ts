import cytoscape from 'cytoscape';
import { DagreLayoutOptions } from 'cytoscape-dagre';
import { HMTreeStep } from './stages/Huffman';
import { sleep } from './utils';

export class HMTree {
    private readonly dagre = require('cytoscape-dagre');
    private readonly background_color: string = "#fff";
    private readonly foreground_color: string = "#000";

    private cy: cytoscape.Core = undefined;

    constructor(element: HTMLElement) {
        cytoscape.use(this.dagre);
        
        this.cy = cytoscape({
            container: element, // container to render in
            autoungrabify: true,
            autounselectify: true,
            boxSelectionEnabled: false,
            layout: {
                name: 'dagre', 
                animate: true,
                fit: true,
              } as DagreLayoutOptions,
    
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': this.background_color,
                        'label': 'data(label)',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        "text-margin-y": 18,
                        'text-wrap': "wrap",
                        "border-width": 2,
                        "border-color": this.foreground_color,
                    },
                },
    
                {
                    selector: 'edge',
                    style: {
                        'width': 3,
                        'line-color': this.foreground_color,
                        'target-arrow-color': this.foreground_color,
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier'
                    }
                }
            ],
        });
    }

    setStep(step: HMTreeStep, animate=true) {
        this.cy.add(step);
        this.cy.layout({
            name: 'dagre',
            animate: animate,
            spacingFactor: 1.1,
            nodeDimensionsIncludeLabels: true
        } as DagreLayoutOptions).run();
    }

    async colorNode(id1: string, id2: string) {
        this.cy.getElementById(id1).style("background-color", "rgb(209, 209, 250)");
        await sleep(500);
        this.cy.getElementById(id2).style("background-color", "rgb(209, 209, 250)");
        await sleep(1000);
    }

    async decolorNode(id1: string, id2: string) {
        await sleep(1000);
        this.cy.getElementById(id1).style("background-color", "white");
        this.cy.getElementById(id2).style("background-color", "white");
    }


    reset() { 
        this.cy.elements().remove();
    }
}

