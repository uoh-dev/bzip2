import cytoscape from 'cytoscape';
import { huffman_tree, BinNode, canonical_huffman_table } from "../../bzip2_enc/huffman_enc";
import { MinHeap } from '../../class/MinHeap';
import { HMTree } from '../huffman_tree';
import { sleep } from '../utils';

export type HMTreeStep = cytoscape.ElementDefinition[]
export interface HMEncStep {
    char: string, 
    code: string,
}

export class Huffman {

    private readonly elParent: HTMLElement;
    private readonly elTree: HTMLElement;
    private readonly encInput: string;
    private readonly distinctChars: number;
    private readonly body1: HTMLElement;
    private readonly body2: HTMLElement;
    private readonly breakLimit: number = 15;
    private readonly treeStepsSaved: HMTreeStep[]

    private treeSteps: HMTreeStep[]; 
    private hmTree: HMTree;
    private hmTable: Map<number, string>;
    private hmCodes: string[];
    private decInput: string[];

    private encSteps: HMEncStep[];

    private currentTreeStep: number = 0;
    private currentEncStep: number = 0;
    private currentDecStep: number = 0;
    private running: boolean = false;
    private encAdded: boolean = false;
    private doneTree: boolean = false;
    private doneEnc: boolean = false;
    private doneDec: boolean = false;

    private elEncode: HTMLElement;

    constructor(input: string, idParent: string) {
        this.elParent = document.getElementById(idParent);
        this.distinctChars = new Set(input).size;

        this.elParent.innerHTML = this.getHTML();
        document.getElementById("idInput").innerText = input;
        this.encInput = input;
        this.elTree = document.getElementById("hmTree");
        this.body1 = document.getElementById("idBody1");
        this.body2 = document.getElementById("idBody2");
        this.hmTree = new HMTree(this.elTree);
        this.treeSteps = this.getTreeSteps(input);
        this.treeStepsSaved = structuredClone(this.treeSteps);
        this.hmTree.setStep([]);
        this.hmTable = canonical_huffman_table(input)[0];
        this.hmCodes = Array.from(this.hmTable.values());
        document.getElementById("btnFinish").style.display = "none";
        document.getElementById("idBtnContinue").addEventListener("click", () => this.setEnc());
        (document.getElementById("idRange") as HTMLInputElement).value = "0";
        (document.getElementById("idRange") as HTMLInputElement).max = (this.treeSteps.length-1).toString();
        document.getElementById("idRange").addEventListener("input", () => {
            if (this.running) return;
            let value = parseInt((document.getElementById("idRange") as HTMLInputElement).value);
            if (value < this.currentTreeStep) {
                this.hmTree = new HMTree(this.elTree);
                this.treeSteps = structuredClone(this.treeStepsSaved);
                this.currentTreeStep = 0;
                for (let i = 0; i <= value; i++) {
                    this.hmTree.setStep(this.treeSteps[this.currentTreeStep++], false);
                }
            } else {
                for (let i = this.currentTreeStep; i <= value; i++) {
                    this.hmTree.setStep(this.treeSteps[this.currentTreeStep++], false);
                }
            }
            if (this.currentTreeStep < this.treeSteps.length && !this.doneTree) {
                let nextButton = document.getElementById("idEncBtnNext");
                nextButton.classList.add("btn-primary");
                nextButton.classList.remove("btn-success");
                nextButton.innerText = "Next";
            } else {
                let nextButton = document.getElementById("idEncBtnNext");
                nextButton.classList.remove("btn-primary");
                nextButton.classList.add("btn-success");
                nextButton.innerText = "Create table";
                this.currentTreeStep++;
            }
        });

        this.decInput = [];
        for (let char of this.encInput) {
            this.decInput.push(this.hmTable.get(char.charCodeAt(0)));
        }
    }

    private setEnc(){ 
        if (!this.encAdded) {
            this.encAdded = true;
            this.elEncode = document.createElement("div");
            this.elEncode.innerHTML = this.getDecHTML();
            this.elEncode.style.height = "750px";
            document.getElementById("car-content").style.height = "1550px";
            document.getElementById("divContent").appendChild(this.elEncode);
            this.fillTable(document.getElementById("idBodyDec1"), document.getElementById("idBodyDec2"), true);            

            document.getElementById("idFieldInput").innerHTML += this.encInput;
            this.encSteps = this.getEncSteps(this.encInput);
            document.getElementById("idBtnDecNext").addEventListener("click", () => {
                if (!this.doneEnc) {
                    this.nextEncStep();
                } else if (!this.doneDec) {
                    this.nextDecStep();
                }
            });
            document.getElementById("idBtnDecSkip").addEventListener("click", () => {
                if (!this.doneEnc) {
                    this.skipEncSteps();
                } else if (!this.doneDec) {
                    this.skipDecSteps();
                }
            })
        }
        this.elEncode.scrollIntoView({ block: "end", inline: "nearest", behavior: "smooth" })
    }

    private getTreeSteps(input: string): HMTreeStep[] {
        let charLeafs = [];
        const heap = new MinHeap<BinNode<{ code?: number, count: number }>>(x => x.data.count);
    
        let stack = [huffman_tree(input)];
        let node = undefined;
        let counter = 0;
        // Insert all leafs into leafs list. And put the rest in the heap (priority is higher than leafs and increases per step).
        // Nodes get ids starting from 1000 because ids are needed for cytoscape. They are put into the heap to get the steps of the huffman tree in order.
        while (node = stack.pop()) {
            if (node.left_child) {  // Not a leaf.
                node.data.code = 1000 + (counter++); // ID that does not clash with the leafs that have char codes as IDs.
                heap.insert(node);
                stack.push(node.left_child);
                stack.push(node.right_child);
            }
            else {
                charLeafs.push(node);
            }
        }
    
        // Leafs are shown in the first step.
        let firstStep: HMTreeStep = []
        charLeafs.forEach((leaf) => {
            firstStep.push({
                group: 'nodes',
                data: {
                    id: String(leaf.data.code),
                    label: String.fromCharCode(leaf.data.code) + "\n\n(" + leaf.data.count + ")"
                },
                classes: 'multiline-manual'
            })
        });
    
        let steps: HMTreeStep[] = [firstStep];
        let newNode = undefined;
        while (newNode = heap.pop()) {
            // Add the next non-char-leaf with lowest count (prio) to tree.
            let nextStep: HMTreeStep = [
                {
                    group: 'nodes',
                    data: {
                        id: String(newNode.data.code),  // id is greater than 1000, but not shown.
                        label: "‎ \n\n(" + newNode.data.count + ")",
                        color: "#0AC"
                    }
                },
                {
                    group: 'edges',
                    css: {
                        'label': '0',
                        'text-margin-y': -10,
                        'text-margin-x': -15,
                        'text-rotation': 'none'
                      },

                    data: {
                        source: String(newNode.data.code),
                        target: String(newNode.left_child.data.code),
                        id: String(newNode.data.code) + String(newNode.left_child.data.code),
                    }
                },
                {
                    group: 'edges',
                    css: {
                        'label': '1',
                        'text-margin-y': -10,
                        'text-margin-x': 15,
                        'text-rotation': 'none'
                      },
                    data: {
                        source: String(newNode.data.code),
                        target: String(newNode.right_child.data.code),
                        id: String(newNode.data.code) + String(newNode.right_child.data.code),
                        
                    }
                }
            ]; 
            steps.push(nextStep)
        }
        return steps
    }

    private getEncSteps(input: string): HMEncStep[] {
        let steps = [];
        for (let char of input) {
            steps.push({
                char: char,
                code: this.hmTable.get(char.charCodeAt(0)),
            });
        }
        return steps;
    }

    async nextTreeStep(): Promise<void> {
        if (this.running || this.doneTree) return
        if (this.currentTreeStep >= this.treeSteps.length) {
            this.fillTable(this.body1, this.body2);
            this.doneTree = true;
            return
        }
        (document.getElementById("idRange") as HTMLInputElement).value = (parseInt((document.getElementById("idRange") as HTMLInputElement).value) + 1).toString();
        if (this.currentTreeStep != 0) {
            let step = this.treeSteps[this.currentTreeStep++];
            this.running = true;
            await this.hmTree.colorNode(step[1].data.target, step[2].data.target);
            this.hmTree.setStep(step);
            await this.hmTree.decolorNode(step[1].data.target, step[2].data.target);
        } else {
            this.running = true;
            this.hmTree.setStep(this.treeSteps[this.currentTreeStep++]);
        }        

        if (this.currentTreeStep == this.treeSteps.length) {
            let nextButton = document.getElementById("idEncBtnNext");
            nextButton.classList.remove("btn-primary");
            nextButton.classList.add("btn-success");
            nextButton.innerText = "Create table";
            this.currentTreeStep++;
        }
        this.running = false;
    }

    skipTreeSteps(): void {
        if (this.running || this.doneTree) return
        let bigStep: HMTreeStep = [];
        while (this.currentTreeStep < this.treeSteps.length) {
           bigStep = bigStep.concat(this.treeSteps[this.currentTreeStep++]);
        }
        this.hmTree.setStep(bigStep);
        (document.getElementById("idRange") as HTMLInputElement).value = (document.getElementById("idRange") as HTMLInputElement).max;

        let nextButton = document.getElementById("idEncBtnNext");
        nextButton.classList.remove("btn-primary");
        nextButton.classList.add("btn-success");
        nextButton.innerText = "Create table";
        this.currentTreeStep = this.treeSteps.length+1;
    }

    private fillTable(body1: HTMLElement, body2: HTMLElement, withID: boolean = false) {
        document.getElementById("idBtnContinue").classList.remove("invisible");
        let i = 0;
        for (let [char, code] of this.hmTable){
            if (i < this.breakLimit) {
                if (withID) {
                    body1.innerHTML += `
                        <tr id="row${String.fromCharCode(char)}">
                            <th>${String.fromCharCode(char)}</th>
                            <th id="code${code}" char="${String.fromCharCode(char)}">${code}</th>
                        </tr>
                    `;
                } else {
                    body1.innerHTML += `
                        <tr>
                            <th>${String.fromCharCode(char)}</th>
                            <th>${code}</th>
                        </tr>
                    `;
                }
                
                i++;
            } else {
                if (withID) {
                    body2.innerHTML += `
                        <tr id="row${String.fromCharCode(char)}">
                            <th>${String.fromCharCode(char)}</th>
                            <th id="code${code}" char="${String.fromCharCode(char)}">${code}</th>
                        </tr>
                    `;
                } else {
                    body2.innerHTML += `
                        <tr>
                            <th>${String.fromCharCode(char)}</th>
                            <th>${code}</th>
                        </tr>
                    `;
                } 
            }
        }
    }

    private async nextEncStep() {
        if (this.running || this.doneEnc || this.currentEncStep >= this.encInput.length) return;
        this.running = true;
        let inputField = document.getElementById("idFieldInput");
        let outputField = document.getElementById("idFieldOutput");
        let els = [document.createElement("span"), document.createElement("span")];
        let step = this.encSteps[this.currentEncStep];
        let tableRow = document.getElementById("row" + step.char);
        els.forEach(el => el.classList.add("letterRL"));
        els[0].classList.add("exact");
        els[0].classList.add("font-monospace");
        els[0].innerText = this.encInput[this.currentEncStep];
        els[1].innerText = this.encInput.slice(this.currentEncStep+1, this.encInput.length);
        inputField.innerHTML = "";
        inputField.appendChild(els[0]);
        inputField.appendChild(els[1]);
        els[0].style.color = "red";
        els[0].style.fontWeight = "bolder";
        await sleep(1000);
        tableRow.classList.add("hm-highlight");
        await sleep(800);
        outputField.innerText += this.hmTable.get(step.char.charCodeAt(0));
        await sleep(800);
        tableRow.classList.remove("hm-highlight");
        inputField.innerHTML = this.encInput.slice(this.currentEncStep+1, this.encInput.length);
        this.currentEncStep++;
        this.running = false;
        if (this.currentEncStep >= this.encInput.length) {
            this.doneDec = true;
        }
    }

    private skipEncSteps() {
        if (this.running || this.doneEnc || this.currentEncStep >= this.encInput.length) return;
        document.getElementById("idFieldInput").innerHTML = "";
        document.getElementById("idFieldOutput").innerText = this.decInput.join("");
        this.doneEnc = true;
    }
    
    private async nextDecStep() {
        if (this.running || this.doneDec || this.currentDecStep >= this.decInput.length) return;
        this.running = true;

        let els = [];
        let encodedText = document.getElementById("idFieldOutput").innerText;
        let run: string = "";
        let rest: HTMLElement;
        for (let i = 0; i < 5; i++) {
            run += encodedText[i];
            let el = document.createElement("span");
            el.innerText = encodedText[i];
            
            if (this.hmCodes.includes(run)) {
                el.classList.add("fs-3")
                els.push(el);     

                if (i+1 < encodedText.length) {
                    rest = document.createElement("span");
                    rest.innerText = encodedText.slice(i+1, encodedText.length);
                    rest.classList.add("fs-3");
                }
                break
            }
            el.classList.add("fs-3")
            els.push(el);
        }
        let elFieldOutput = document.getElementById("idFieldOutput");
        elFieldOutput.innerHTML = "";
        els.forEach(el => elFieldOutput.appendChild(el));
        if (typeof rest !== "undefined") elFieldOutput.appendChild(rest);
        for (let el of els) {
            el.style.color = "red";
            el.style.fontWeight = "bolder";
            await sleep(400);
        }
        await sleep(400);
        console.log(run)
        let tableCode = document.getElementById("code" + run);
        tableCode.parentElement.classList.add("hm-highlight");
        await sleep(800);
        document.getElementById("idFieldDec").innerText += tableCode.getAttribute("char");
        document.getElementById("idFieldOutput").innerText = encodedText.slice(run.length, encodedText.length);
        tableCode.parentElement.classList.remove("hm-highlight");


        // set document.getElementById("idFieldOutput") to els[-1].innerText.
        this.currentDecStep++;
        this.running = false;
        if (this.currentDecStep >= this.decInput.length) {
            this.doneDec = true;
            document.getElementById("btnFinish").style.display = "";
            this.elEncode.style.height = "680px";
        }
    }

    private skipDecSteps(){ 
        if (this.doneDec || this.running) return;
        document.getElementById("idFieldDec").innerText = this.encInput;
        document.getElementById("idFieldOutput").innerText = "";
        this.doneDec = true;
        document.getElementById("btnFinish").style.display = "";
        this.elEncode.style.height = "680px";
    }

    getHTML() {
        let superlativHTML: string = `
            <div class="text-center"><span class="fs-4 fw-bolder">Input: </span><span id="idInput" class="fs-4 exact font-monospace"></span></div>
        `;

        let upperHTML: string;
        if (this.distinctChars > this.breakLimit) {
            upperHTML = /*HTML*/`
            <div class="row pb-2">
            <div class="col-6">
                <span class="col-4 fs-3 fw-bolder">Encoding Table</span>
                <div id="rowTab1" class="row pt-3">
                    <div class="col-6">
                        <table class="table table-striped hm-table"  style="background-color: rgb(205, 222, 253);">
                            <thead id="idHead1">
                                <tr>
                                    <th style="background-color: rgb(122, 181, 248);">Char</th>
                                    <th style="background-color: rgb(122, 181, 248);">Code</th>
                                </tr>
                            </thead>
                            <tbody id="idBody1">
                            </tbody>
                        </table>
                    </div>
                    <div class="col-6">
                        <table class="table table-striped hm-table"  style="background-color: rgb(205, 222, 253);">
                            <thead>
                                <tr>
                                    <th style="background-color: rgb(122, 181, 248);">Char</th>
                                    <th style="background-color: rgb(122, 181, 248);">Code</th>
                                </tr>
                            </thead>
                            <tbody id="idBody2">
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
        else {
            upperHTML = /*HTML*/`
            <div class="row pb-4">
            <div class="col-6">
                <div class="text-center"><span class="col-4 fs-3 fw-bolder">Encoding Table</span></div>
                <div id="rowTab1" class="row pt-3">
                    <div class="col-3"></div>
                    <div class="col-6">
                        <table class="table table-striped hm-table"  style="background-color: rgb(205, 222, 253);">
                            <thead>
                                <tr>
                                    <th style="background-color: rgb(122, 181, 248);">Char</th>
                                    <th style="background-color: rgb(122, 181, 248);">Code</th>
                                </tr>
                            </thead>
                            <tbody id="idBody1">
                            </tbody>
                        </table>
                    </div>
                    <div class="col-3"></div>
                    <div class="col-6" style="display:none;">
                        <table class="table table-striped hm-table"  style="background-color: rgb(205, 222, 253);">
                            <thead>
                                <tr>
                                    <th style="background-color: rgb(122, 181, 248);">Char</th>
                                    <th style="background-color: rgb(122, 181, 248);">Code</th>
                                </tr>
                            </thead>
                            <tbody id="idBody1">
                            
                            </tbody>
                        </table>
                    </div>
                </div>
            
            `;
        }

        return superlativHTML + upperHTML + /*HTML*/ `
            </div>
            <div class="col-6">
                <div class="row pb-2">
                    <div class="col-7">
                        <div class="row">
                            <span class="col-6 fs-3 fw-bolder">Huffman tree</span>
                            <div class="d-flex col-6 pt-2">
                                <input id="idRange" class="range" type="range" min="0" max="11" step="1">
                            </div>
                        </div>
                    </div>

                    <div class="col-5 text-end" style="padding-right: 15px;">
                        <button id="idEncBtnNext" type="button" class="btn btn-primary btn-lg px-4">Next</button>
                        <button id="idEncBtnSkip" type="button" class="btn btn-primary btn-lg px-4">Skip</button>

                    </div>
                </div>
                <div id="hmTree" class="hm-tree">

                </div>
            </div>
        </div>
        <div class="text-center pb-3">
            <button id="idBtnContinue" type="button" class="btn btn-success btn-lg invisible">Continue</button>
        </div> 
        `;
    }

    getDecHTML(){ 
        let lowerHTML: string;
        if (this.distinctChars > this.breakLimit){
            lowerHTML = /*HTML*/ `
                <div id="rowTab2" class="row col-6 pt-5 mt-2">
                    <div class="col-6">
                        <table class="table table-striped hm-table" style="background-color: rgb(205, 222, 253);">
                            <thead id="idHead1">
                                <tr>
                                    <th style="background-color: rgb(122, 181, 248);">Char</th>
                                    <th style="background-color: rgb(122, 181, 248);">Code</th>
                                </tr>
                            </thead>
                            <tbody id="idBodyDec1">
                            </tbody>
                        </table>
                    </div>
                    <div class="col-6">
                        <table class="table table-striped hm-table"  style="background-color: rgb(205, 222, 253);">
                            <thead>
                                <tr>
                                    <th style="background-color: rgb(122, 181, 248);">Char</th>
                                    <th style="background-color: rgb(122, 181, 248);">Code</th>
                                </tr>
                            </thead>
                            <tbody id="idBodyDec2">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div> 
            `;
        } else {
            lowerHTML = /*HTML*/ `
                <div id="rowTab2" class="row col-6 pt-5 mt-2">
                    <div class="col-3"></div>
                    <div class="col-6">
                        <table class="table table-striped hm-table"  style="background-color: rgb(205, 222, 253);">
                            <thead>
                                <tr>
                                    <th style="background-color: rgb(122, 181, 248);">Char</th>
                                    <th style="background-color: rgb(122, 181, 248);">Code</th>
                                </tr>
                            </thead>
                            <tbody id="idBodyDec1">
                            </tbody>
                        </table>
                    </div>
                    <div class="col-3"></div>
                    <div class="col-6" style="display:none;">
                        <table class="table table-striped hm-table"  style="background-color: rgb(205, 222, 253);">
                            <thead>
                                <tr>
                                    <th style="background-color: rgb(122, 181, 248);">Char</th>
                                    <th style="background-color: rgb(122, 181, 248);">Code</th>
                                </tr>
                            </thead>
                            <tbody id="idBodyDec1">
                            
                            </tbody>
                        </table>
                    </div>
                </div>
            </div> 
            `;
        }
        return /*HTML*/ `
        <div class="row pt-4">
            <div class="row col-6" style="margin-right: 10px">
                <div class="d-flex pb-2 justify-content-between">
                    <span id="idCurStep" class="fs-3 fw-bold">Encoding:</span>
                    <div>
                        <button id="idBtnDecNext" type="button" class="btn btn-primary btn-lg px-4">Next</button>
                        <button id="idBtnDecSkip" type="button" class="btn btn-primary btn-lg px-4" style="margin-left: 10px">Skip</button>
                    </div>
                    
                </div>
                <div class="hm-input text-center fs-3" style="background-color: rgb(209, 209, 250)">
                    <span>Input: </span><br>
                    <span id="idFieldInput"></span>
                </div>
                <div class="hm-input text-center fs-3" style="background-color: rgb(250, 247, 209); height: 250px;">
                    <span>Encoded: </span><br>
                    <span id="idFieldOutput" style="word-break: break-all"></span>
                </div>
                <div class="hm-input text-center fs-3" style="background-color: rgb(209, 209, 250)">
                    <span>Decoded: </span><br>
                    <span id="idFieldDec"></span>
                </div>
            </div>
        ` + lowerHTML;
    }

    finish() {
        document.getElementById("labelOutput").innerText = "Output (Binary)";
        document.getElementById("resultBoxInput").innerText = this.encInput;
        console.log(this.decInput.join("").length)
        if (this.decInput.join("").length > 110) {
            document.getElementById("resultBoxOutput").classList.remove("fs-3");
            document.getElementById("resultBoxOutput").classList.add("fs-4");
        }
        document.getElementById("resultBoxOutput").innerText = this.decInput.join("");
        let inputBits = this.encInput.length*8;
        let inputBPC = 8;
        let outputBits = this.decInput.join("").length;
        let outputsBPC = Math.round((outputBits/this.encInput.length)*100)/100;

        let savedBitsRel = Math.round(((1- outputBits/inputBits)*100)*10)/10;
        let savedBPC = Math.round((inputBPC-outputsBPC)*100)/100;
        document.getElementById("inputStats").innerHTML = /*HTML*/ `
            <tr>
                <th>Bits</th>
                <th>${inputBits}</th>
            </tr>
            <tr>
                <th>Bits per character</th>
                <th>${8}</th>
            </tr>
        `;
        document.getElementById("outputStats").innerHTML = /*HTML*/ `
            <tr>
                <th>Bits</th>
                <th>${outputBits}</th>
            </tr>
            <tr>
                <th>Bits per character</th>
                <th>${outputsBPC.toFixed(2)}</th>
            </tr>
        `;
        document.getElementById("diffStats").innerHTML = /*HTML*/ `
            <tr>
                <th>Saved bits</th>
                <th>${inputBits-outputBits}</th>
            </tr>
            <tr>
                <th>Saved bits per character</th>
                <th>${savedBPC}</th>
            </tr>
            <tr>
                <th>Saved space (relative)</th>
                <th>${savedBitsRel}%</th>
            </tr>
        `;
    }
}