import { burrows_wheeler_transform } from "../../bzip2_enc/burrows_wheeler_transform";
import { huffman_enc } from "../../bzip2_enc/huffman_enc";
import { run_length_enc } from "../../bzip2_enc/run_length_enc";

export type BWTDecObj = string[];
export interface BWTObj {
    rotations: string[],        // Rotations of input.
    sortedRotations: string[],  
    resultRotations: string[],  // Sorted rotations but last element has special classes.
    out: string           // Last character of all sorted rotations.
}

export class BurrowsWheeler {

    private readonly elEncRotations1: HTMLElement;
    private readonly elEncRotations2: HTMLElement;
    private readonly elEncSortedRotations1: HTMLElement;
    private readonly elEncSortedRotations2: HTMLElement;
    private readonly elParent: HTMLElement;
    private readonly END = "§";
    private readonly resultClasses: string;
    private readonly endTag: string;
    private readonly savedInput: string;
    private encSteps: BWTObj[];
    public readonly encOutput: string = "";
    
    private decOutput: string;
    private decSteps: BWTDecObj[];
    private elMatrix: HTMLElement;
    private decAdded: boolean = false;
    private elDecButton: HTMLElement;


    private elDecode: HTMLElement;
    private running: boolean = false;
    private sort: boolean = true;
    private decDone: boolean = false;

    private readonly sortFunction = (a: string | string[], b: string | string[]) => {
        for (let i = 0; i < a.length; i++) {
            if (a[i] == this.END) return 1000000;
            if (b[i] == this.END) return -1000000;
            let cmp = a[i].charCodeAt(0) - b[i].charCodeAt(0);
            if (cmp == 0) continue;
            return cmp;
        }
    }

    constructor(input: string, idParent: string) {
        this.elParent = document.getElementById(idParent);
        this.savedInput = input;
        this.elParent.innerHTML = this.getHTML(input.length);
        this.elEncRotations1 = document.getElementById("rotations1");
        this.elEncRotations2 = document.getElementById("rotations2");
        this.elEncSortedRotations1 = document.getElementById("sortedRotations1");
        this.elEncSortedRotations2 = document.getElementById("sortedRotations2");
        this.resultClasses = ["BWTresult", "text-decoration-underline"].join(" ");
        this.endTag = `<span class=${["end"].join(" ")}>${this.END}</span>`;

        this.encSteps = this.getEncSteps(input);
        this.encOutput = this.encSteps[0].out;
        document.getElementById("btnFinish").style.display = "none";
        document.getElementById("btnDecode").addEventListener("click", () => this.setDec());
        document.getElementById("btnDecode").classList.add("invisible");
    }

    setDec() {
        if (!this.decAdded) {
            this.decAdded = true;
            this.elDecode = document.createElement("div");
            this.elDecode.innerHTML = this.getDecHTML();
            this.elDecode.style.height = "761px";
            document.getElementById("divContent").appendChild(this.elDecode);
            this.decSteps = this.getDecSteps(this.encOutput);
            
            for (let row of this.decSteps[this.decSteps.length-1]) {
                if (row[row.length-1] == this.END) {
                    this.decOutput = row;
                    break;
                }
            }

            this.elMatrix = document.getElementById("matrix");
            document.getElementById("car-content").style.minHeight = "1480px";
            this.elDecButton = document.getElementById("idDecButton");
            document.getElementById("idDecBtnSkip").addEventListener("click", () => this.skipDecSteps());
            this.elMatrix.style.fontSize = (480/Math.max(this.encOutput.length, 1)) + "px";

            this.elDecButton.addEventListener("click", () => this.nextDecStep());
            this.elDecButton.innerText = "Add Col";
        }

        this.elDecode.scrollIntoView({ block: "end", inline: "nearest", behavior: "smooth" })
        this.elMatrix.innerHTML="<br>".repeat(this.encOutput.length);
    }

    getEncSteps(input: string): BWTObj[] {
        let rotations: string[][] = [input.split("").concat([this.END])];
        for (let i = 0; i < rotations[0].length - 1; i++) {
            let cur: string[] = rotations[i];
            rotations.push([cur[cur.length - 1]].concat(cur.slice(0, cur.length - 1)));
        }

        let sortedRotations: string[][] = structuredClone(rotations);
        sortedRotations.sort(this.sortFunction);

        let BWTResult: string = "";
        let resultRotations: string[] = []; 
        for (let i = 0; i < sortedRotations.length; i++){
            let rotation = structuredClone(sortedRotations[i]);
            BWTResult += rotation[rotation.length-1];
            rotation = rotation.slice(0, rotation.length-1).concat([`<span class='${this.resultClasses}'>${rotation[rotation.length-1]}</span>`]);
            resultRotations.push(rotation.map(letter => (letter == this.END) ? this.endTag : letter).join(""));
        }

        return [{
            rotations: rotations.map(rotation => rotation.map(letter => (letter == this.END) ? this.endTag : letter).join("")),
            sortedRotations: sortedRotations.map(rotation => rotation.map(letter => (letter == this.END) ? this.endTag : letter).join("")), 
            resultRotations: resultRotations, 
            out: BWTResult
        }];
    }

    getDecSteps(input: string) {
        let steps: BWTDecObj[] = [];
        let matrix: string[] = new Array(input.length).fill("");
        for (let i = 0; i < input.length; i++) {
            for (let j = 0; j < input.length; j++) {
                matrix[j] = input[j] + matrix[j]
            }
            steps.push(structuredClone(matrix));
            matrix = matrix.sort(this.sortFunction);
            steps.push(structuredClone(matrix));
        }
        return steps;
    }

    nextEncStep(index: number): void {
        this.reset();
        for (let i = 1; i <= index; i++) {
            switch(i){
                case 1: this.step1(); break;
                case 2: this.step2(); break;
                case 3: this.step3(); break;
            }
        }  
    }

    nextDecStep() {
        if (this.running || this.decDone) {
            document.getElementById("btnFinish").click();
            return;
        }
        if (this.decSteps.length == 1) {
            this.elDecButton.innerText = "Find text";
            this.elDecButton.classList.remove("btn-primary");
            this.elDecButton.classList.add("btn-success");
            this.elMatrix.innerHTML = ""
            this.decSteps[0].forEach(row => {
                if (row[row.length-1] == this.END) {
                    let thatRow = document.createElement("span");  
                    thatRow.id = "thatRow";
                    thatRow.innerText = row.split("").join(" ");
                    this.elMatrix.appendChild(thatRow);
                    this.elMatrix.innerHTML += "<br>"
                } else {
                    this.elMatrix.innerHTML += row.split("").join(" ") + "<br>";
                }
            })
            this.decSteps.shift();
            this.sort = !this.sort;
        } else if (this.decSteps.length == 0) {
            document.getElementById("thatRow").style.color = "red";
            document.getElementById("thatRow").style.textDecoration = "underline";
            this.elDecButton.innerText = "Finish";
            this.elDecButton.classList.remove("btn-success");
            this.elDecButton.classList.add("btn-danger");
            this.decDone = true;
            document.getElementById("btnFinish").style.display = "";
        } else {
            this.elDecButton.innerText = (this.sort) ? "Sort" : "Add Col";
            let newHTML = "";
            this.decSteps[0].forEach(row => {
                newHTML += row.split("").join(" ") + "<br>";
            })
            this.elMatrix.innerHTML = newHTML;
            this.decSteps.shift();
            this.sort = !this.sort;
        }
    }

    skipDecSteps() {
        while (this.decSteps.length > 0) {
            this.nextDecStep();
        }
    }

    public reset(): void{
        this.elEncRotations1.innerHTML = "";
        this.elEncRotations2.innerHTML = "";
        this.elEncSortedRotations1.innerHTML = "";
        this.elEncSortedRotations2.innerHTML = "";
    }
    
    private step1(): void {
        if (this.encSteps[0].rotations.length > 19) {
            this.elEncRotations1.innerHTML = this.encSteps[0].rotations.slice(0, 19).join("<br>");
            this.elEncRotations2.innerHTML = this.encSteps[0].rotations.slice(19).join("<br>");
        }
        else {
            this.elEncRotations1.innerHTML = this.encSteps[0].rotations.join("<br>");
            this.elEncRotations2.innerHTML = "";
        }
    }

    private step2(): void { 
        if (this.encSteps[0].sortedRotations.length > 19) {
            this.elEncSortedRotations1.innerHTML = this.encSteps[0].sortedRotations.slice(0, 19).join("<br>");
            this.elEncSortedRotations2.innerHTML = this.encSteps[0].sortedRotations.slice(19).join("<br>");
        } else {
            this.elEncSortedRotations1.innerHTML = this.encSteps[0].sortedRotations.join("<br>");
            this.elEncSortedRotations2.innerHTML = "";
        }
    }

    private step3(): void {
        if (this.encSteps[0].resultRotations.length > 19) {
            this.elEncSortedRotations1.innerHTML = this.encSteps[0].resultRotations.slice(0, 19).join("<br>");
            this.elEncSortedRotations2.innerHTML = this.encSteps[0].resultRotations.slice(19).join("<br>");
        } else {
            this.elEncSortedRotations1.innerHTML = this.encSteps[0].resultRotations.join("<br>");
            this.elEncSortedRotations2.innerHTML = "";
        }
        document.getElementById("idEncResult").innerText = "Result: " + this.encOutput;
        document.getElementById("idEncResult").classList.remove("invisible");
        document.getElementById("btnDecode").classList.remove("invisible");
    }

    skipSteps = () => this.nextEncStep(3);

    getHTML(inputLength: number){ 
        let upperHTML: string;
        if (inputLength >= 19) {
            upperHTML = /*HTML*/ `
            <!-- Text transformations -->
            <div class="row justify-content-around fs-4 fw-bolder text-center" style="height: 40px;">
                <div class="col-6" style="margin-right: 3%; width: 47%;">Text rotations:<br><br></div>
                <div class="col-6" style="margin-left: 3%; width: 47%;">Sorted rotations:<br><br></div>
            </div>
            <div id="boxRow" class="row justify-content-around mb-2" style="height: 435px; max-height:435px;">
                <div id="rotBox1" class= "row rotations pt-3" style="margin-right: 1%; width: 49%;">
                    <div id="rotations1" class="col-6 lh-sm font-monospace exact text-center" style="max-height:420px;"></div>
                    <div id="rotations2" class="col-6 lh-sm font-monospace exact text-center" style="max-height:420px;"></div>
                </div>
                <div id="rotBox2" class="row rotations pt-3" style="background-color: rgb(250, 247, 209); margin-left: 1%; width: 49%;">
                    <div id="sortedRotations1" class="col-6 lh-sm font-monospace exact text-center" style="max-height:420px;"></div>
                    <div id="sortedRotations2" class="col-6 lh-sm font-monospace exact text-center" style="max-height:420px;"></div>
                </div>
            </div>
            `;
        }
        else {
            upperHTML = /*HTML*/ `
            <!-- Text transformations -->
            <div class="row justify-content-center fs-4 fw-bolder text-center" style="height: 40px;">
                <div class="col-2" style="margin-right: 8%;">Text rotations:</div>
                <div class="col-2">Sorted rotations:</div>
            </div>
            <div id="boxRow" class="row justify-content-center mb-2" style="height: 435px">
                <div id="rotBox1" class= "row rotations pt-3" style="margin-right: 2%; width: 20%;">
                    <div id="rotations1" class="col-12 lh-sm font-monospace exact text-center"></div>
                    <div id="rotations2" class="col-6 lh-sm font-monospace exact text-center" style="display: none;"></div>
                </div>
                <div id="rotBox2" class="row rotations pt-3" style="background-color: rgb(250, 247, 209); margin-left: 2%; width: 20%;">
                    <div id="sortedRotations1" class="col-12 lh-sm font-monospace exact text-center"></div>
                    <div id="sortedRotations2" class="col-6 lh-sm font-monospace exact text-center" style="display: none;"></div>
                </div>
            </div>
            `;
        }

        return /*HTML*/ `<span id="idEncResult" class="fs-4 invisible exact font-monospace" style="display: table; margin: 0 auto;">Result: </span>` + upperHTML + /*HTML*/ `
        <div id="stepper" class="bs-stepper" style="width: 80%; margin:auto;"> 
            <div class="bs-stepper-content px-4 fs-5">
                <div id="step1" class="content text-center exact" role="tabpanel" aria-labelledby="step1-trigger"> </div>
                <div id="step2" class="content text-center" role="tabpanel" aria-labelledby="step2-trigger">
                    Rotate
                </div>
                <div id="step3" class="content text-center" role="tabpanel" aria-labelledby="step3-trigger">
                    Sort
                </div>
                <div id="step4" class="content text-center" role="tabpanel" aria-labelledby="step4-trigger">
                    Take last character of each rotation
                </div>
            </div>
            <div class="bs-stepper-header" role="tablist">
                <div class="step" data-target="#step1">
                    <button type="button" id="step1-trigger" class="step-trigger" role="tab" aria-selected="true">
                        <span id="circle1" class="bs-stepper-circle"></span>
                    </button>
                </div>
                <div class="bs-stepper-line"></div>
                <div class="step" data-target="#step2">
                    <button type="button" class="step-trigger" id="step2-trigger" role="tab">
                        <span id="circle2" class="bs-stepper-circle" style="background-color: darkgrey;"></span>
                    </button>
                </div>
                <div class="bs-stepper-line"></div>
                <div class="step" data-target="#step3">
                    <button type="button" class="step-trigger" id="step3-trigger" role="tab">
                        <span id="circle3" class="bs-stepper-circle" style="background-color: darkgrey;"></span>
                    </button>
                </div>
                <div class="bs-stepper-line"></div>
                <div class="step" data-target="#step4">
                    <button type="button" class="step-trigger" id="step4-trigger" role="tab">
                        <span id="circle4" class="bs-stepper-circle" style="background-color: darkgrey;"></span>
                    </button>
                </div>
                <div class="mx-3">
                    <button id="idEncBtnNext" type="button" style="float: right;" class="d-flex btn btn-primary btn-lg px-4">
                        Next
                    </button>
                </div>
            </div>
        </div>
        <div class="d-flex justify-content-center">
            <button id="btnDecode" type="button" class="d-flex btn btn-success btn-lg px-4 invisible">
                Decode
            </button>
        </div>
        `;
    }

    getDecHTML() {
        return /*HTML*/`
        <div class="row justify-content-between pt-4" style="width: 40%; margin-left: 30%; margin-right: 30%;">
            <div class="col-5 fs-4 fw-bolder pt-2">Decoding: <button id="idDecBtnSkip" type="button" class="btn btn-primary btn-md px-4">Skip</button></div>
            <div class="col-4 pb-2 text-end">
                <button id="idDecButton" type="button" class="btn btn-primary btn-lg px-4">Add Col</button>
            </div>
        </div>
        <div class="row justify-content-center">
            <div id="matrix" class="col-8 exact font-monospace lh-sm text-end matrix py-2 mb-4" style="font-size: 12px;"></div>
        </div>
    `;
    }

    finish() {
        document.getElementById("resultBoxInput").innerText = this.savedInput;
        document.getElementById("resultBoxOutput").innerText = this.encOutput;
        let inputBits = this.savedInput.length*8;
        let outputBits = this.encOutput.length*8-8;
        let bwt = "";
        let no = true;
        for (let char of burrows_wheeler_transform(this.savedInput)) {
            if (char == "\xFF" && no) {
                no = false
                continue;
            };
            if (no) continue;
            bwt += char;
        }

        let inputHM = (huffman_enc(this.savedInput).slice(256).length-1)*8;
        let outputHM = (huffman_enc(bwt).slice(256).length-1)*8;
        let inputRL = run_length_enc(this.savedInput).length*8;
        let outputRL = run_length_enc(bwt).length*8;

        document.getElementById("inputStats").innerHTML = /*HTML*/ `
            <tr>
                <th>Bits (Without ${this.END}) </th>
                <th>${inputBits}</th>
            </tr>
            <tr>
                <th>Bits after Huffman</th>
                <th>${inputHM}</th>
            </tr>
            <tr>
                <th>Bits after Run-length</th>
                <th>${inputRL}</th>
            </tr>
        `;
        document.getElementById("outputStats").innerHTML = /*HTML*/ `
            <tr>
                <th>Bits</th>
                <th>${outputBits}</th>
            </tr>
            <tr>
                <th>Bits after Huffman</th>
                <th>${outputHM}</th>
            </tr>
            <tr>
                <th>Bits after Run-length</th>
                <th>${outputRL}</th>
            </tr>
        `;
        document.getElementById("diffStats").innerHTML = /*HTML*/ `
            <tr>
                <th>Saved bits</th>
                <th>${inputBits-outputBits}</th>
            </tr>
            <tr>
                <th>Saved bits after Huffman</th>
                <th>${inputHM-outputHM}</th>
            </tr>
            <tr>
                <th>Saved bits after Run-length</th>
                <th>${inputRL-outputRL}</th>
            </tr>
        `;
    }
    
}