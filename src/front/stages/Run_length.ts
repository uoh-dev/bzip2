import { sleep } from "../utils";

export interface RLEncObj {
    counter: number, 
    letter: string,
}

export interface RLDecObj {
    input: string,
    output: string,
}

export class RunLength {

    private readonly elParent: HTMLElement;
    private encSteps: any;
    private decSteps: any;

    private running: boolean = false;
    private encInput: string = "";
    private savedInput: string = "";
    private encOutput: string = "";
    private decInput: string[];
    private decOutput: string;

    private readonly elEncInput: HTMLElement;
    private readonly elEncCounter: HTMLElement;
    private readonly elEncValue: HTMLElement;
    private readonly elEncResult: HTMLElement;
    private readonly elEncText: HTMLElement;

    private readonly elDecInput: HTMLElement;
    private readonly elDecResult: HTMLElement;

    constructor(input: string, idParent: string) { 
        this.elParent = document.getElementById(idParent);
        this.elParent.innerHTML = this.getHTML();
        this.encInput = input;
        this.savedInput = input;
        this.encSteps = this.getEncSteps(input);

        this.elEncCounter = document.getElementById("idEncCounter");
        this.elEncInput = document.getElementById("idEncInput");
        this.elEncValue = document.getElementById("idEncValue");
        this.elEncResult = document.getElementById("idEncResult");
        this.elEncText = document.getElementById("idEncText");

        this.elDecInput = document.getElementById("idDecInput");
        this.elDecResult = document.getElementById("idDecResult");

        this.elEncText.innerText = input;
        this.elEncInput.innerText = input;
    }

    setDec(){
        this.decInput = this.encOutput.split("©");
        this.decSteps = this.getDecSteps(this.encOutput);
        this.decSteps = this.decSteps.slice(1, this.decSteps.length);
        this.decOutput = this.decSteps[this.decSteps.length-1].output;

        this.elDecInput.innerText = this.encOutput.replaceAll("©", " ");
    }

    getEncSteps(input: string){ 
        const encSteps: RLEncObj[] = [];
        let run_value;
        let counter = 0;
        for (const char of input) {
            if (char === run_value) {
                counter++;
                continue;
            }
            encSteps.push({counter: counter, letter: run_value});
            counter = 1;
            run_value = char;
        }
        encSteps.shift();
        encSteps.push({counter: counter, letter: run_value});
        return encSteps;
    }

    async nextEncStep(): Promise<void> {
        if (this.encInput.length == 0 || this.running) return;
    
        this.running = true;
        this.elEncValue.innerText = this.encInput[0];
        let elements = [];
        for (let i = 0; i < this.encSteps[0].counter; i++) {
            let element = document.createElement("div");
            element.classList.add("letterRL");
            element.innerText = this.encInput[i];
            elements.push(element);
        }
        let restEl = document.createElement("div");
        restEl.classList.add("letterRL");
        restEl.innerText = this.encInput.slice(this.encSteps[0].counter, this.encInput.length);
        this.elEncInput.innerHTML = "";
        (elements.concat(restEl)).forEach(el => this.elEncInput.appendChild(el));
    
        for (const index in elements){
            elements[index].style.color="red"; 
            elements[index].style.fontWeight = "bolder";
            this.elEncCounter.innerText = (parseInt(index) + 1) + "";
            await sleep(150);
        }
        await sleep(200)
        for (const index in elements){
            if (index == "0") continue;
            elements[index].style.transform = `translate(${Math.abs(elements[0].offsetLeft - elements[index].offsetLeft)*-1}px, 0)`;
        }
        if (this.encSteps[0].counter != 1){
            restEl.style.transform = `translate(${Math.abs(elements[1].offsetLeft - restEl.offsetLeft)*-1 - 0.1}px, 0)`;
            await sleep(500);
        }

        let firstEl = document.createElement("div")
        firstEl.classList.add("letterRL");
        firstEl.innerText = this.encInput[0];
        firstEl.style.color = "red";
        firstEl.style.fontWeight = "bolder";
        this.elEncInput.innerHTML = "";
        this.elEncInput.appendChild(firstEl);
        restEl.style.transform = "";
        this.elEncInput.appendChild(restEl);
        await sleep(500);

        firstEl.style.color = "blue";
        this.elEncCounter.style.color = "blue";
        this.elEncCounter.style.fontWeight = "bolder";
        await sleep(600);

        let result = this.elEncResult.innerText;
        let counterEl = document.createElement("div");
        counterEl.innerText = this.elEncCounter.innerText;
        counterEl.style.color = "blue";
        counterEl.style.fontWeight = "bolder";
        counterEl.style.display = "inline";
        this.elEncResult.appendChild(counterEl);
        this.elEncResult.appendChild(firstEl);
        this.elEncCounter.innerText = "0";
        this.elEncCounter.style.color = "black";
        this.elEncCounter.style.fontWeight = "normal";
        await sleep(500);
        
        let nextResult = result + counterEl.innerText + this.encInput[0] + " ";
        if (nextResult.length > 79) {
            this.elEncResult.classList.add("fs-6");
        } else {
            this.elEncResult.classList.remove("fs-6");
        }
        this.elEncResult.innerText = nextResult;
        this.encOutput += counterEl.innerText + this.encInput[0] + "©";
        this.encInput = this.encInput.slice(this.encSteps[0].counter, this.encInput.length);
        this.elEncInput.innerText = this.encInput;
        this.encSteps.shift();
        this.running = false;
        if (this.encInput.length == 0) this.setDec();
    }

    skipEncSteps(){
        if (this.encInput.length == 0 || this.running) return;
        this.elEncCounter.innerText = "0";
        this.elEncInput.innerText = "";
    
        let outs: string[] = [];
        for (let s of this.encSteps) {
            this.elEncResult.innerText += s.counter + s.letter + " ";
            outs = outs.concat([(s.counter+"") + s.letter]);
        }
        if (this.elEncResult.innerText.length > 79) {
            this.elEncResult.classList.add("fs-6");
        } else {
            this.elEncResult.classList.remove("fs-6");
        }
        this.encOutput = this.encOutput + outs.join("©");
        this.encInput = "";
        this.encSteps = [];
        this.setDec();
    }

    getDecSteps(input: string) {
        let steps: RLDecObj[] = [{input: "", output: ""}];
        let splitInput = input.split("©");
        if (splitInput[splitInput.length-1] == "") splitInput = splitInput.slice(0, splitInput.length-1);
        
        // 7a 5b 1x 2c 
        for (let i = 0; i < splitInput.length; i++){
            steps.push({
                input: splitInput.slice(i+1, splitInput.length).join("©"),
                output: steps[i].output + splitInput[i][splitInput[i].length-1].repeat(parseInt(splitInput[i].slice(0, splitInput[i].length-1)))
            })
        }
        return steps;
    }

    async nextDecStep(): Promise<void> {
        if (typeof this.decSteps === "undefined" || this.decSteps.length == 0 || this.decInput.length == 0 || this.running) return;
        this.running = true;
        this.elDecInput.innerHTML = "";

        let elements: HTMLElement[] = [document.createElement("div"), document.createElement("div"), document.createElement("div")];
        elements[0].innerText = this.decInput[0].slice(0, this.decInput[0].length-1);
        elements[1].innerText = this.decInput[0][this.decInput[0].length-1];
        elements[2].innerText = " " + this.decInput.slice(1, this.decInput.length).join(" ");
        let count = parseInt(elements[0].innerText);
        let letter = this.decInput[0][this.decInput[0].length-1];
        elements.forEach(el => {el.classList.add("letterRLDec");});
        elements.forEach(el => this.elDecInput.appendChild(el));
        
        
        elements[0].style.color = "blue";
        elements[0].style.fontWeight = "bolder";
        
        await sleep(500);
        elements[1].style.color = "red";
        elements[1].style.fontWeight = "bolder";

        await sleep(500);
        let deltaLetter = 16.5;
        let newElements = [];
        for (let i = 0; i < count; i++){
            let el = document.createElement("div");
            Object.assign(el.style, { display: "inline-block", color: "red", fontWeight: "bolder", fontSize: "30px"});
            el.innerText = letter;
            this.elDecInput.appendChild(el);
            newElements.push(el);
            el.style.transform = `translate(${-deltaLetter*(i) -(deltaLetter*(elements[2].innerText.length-1) + deltaLetter*(2))}px, 0)`;
        }

        await sleep(1);
        elements[2].style.transform = `translate(${deltaLetter*(newElements.length+1)}px, 0)`;
        newElements.forEach((el) => { 
            el.classList.add("letterRLDec"); 
            el.style.transform = `translate(${-(deltaLetter*(elements[2].innerText.length-1))}px, 0)`;

        });

        await sleep(1000);
        this.elDecResult.innerHTML += `<div style="color: blue; font-weight: bold; display: inline-block">${letter.repeat(count)}</div>`;
        this.elDecInput.innerText = this.decSteps[0].input.replaceAll("©", " ");
        await sleep(500);
        this.elDecResult.innerHTML = this.decSteps[0].output;
        this.decSteps.shift();
        this.decInput.shift();
        this.running = false;
        if (this.decInput.length == 0 || this.decSteps.length == 0) this.decFinish();
    }

    skipDecSteps(): void {
        if (typeof this.decSteps === "undefined" || this.decSteps.length == 0 || this.decInput.length == 0 || this.running) return;
        this.elDecInput.innerText = "";
        this.elDecResult.innerText = this.decOutput;
        this.decInput = [];
        this.decFinish();
    }

    decFinish(){
        document.getElementById("btnFinish").style.display = "";
    }


    getHTML(){
        return /*HTML*/ `
        <!-- Encoding -->
        <div class="row py-2">
            <div class="col-8 me-auto">
                <span class="fs-4 fw-bolder" style="padding-right: 10px;">Encoding: </span>
                <span id="idEncText" class="font-monospace fs-4 exact"></span>
            </div>
            <div class="col-2 text-end fs-4">
                <span >Current Run: </span>
                <span id="idEncCounter" class="font-monospace exact">0</span><span id="idEncValue" class="font-monospace exact">-</span>
            </div>
            <div class="col-2 d-flex justify-content-end">
                <button id="idEncBtnNext" type="button" class="btn btn-primary btn-lg px-4">Next</button>
                <button id="idEncBtnSkip" type="button" class="btn btn-primary btn-lg px-4" style="margin-left: 15px">Skip</button>
            </div>
        </div>
        <div class="RL" style="background-color: rgb(209, 209, 250);">
            <div class="row h-50 align-items-center">
                <div class="col-1 d-flex justify-content-end fs-3">
                    Input:
                </div>
                <div id="idEncInput" class="col-11 exact fs-3 font-monospace"></div>
            </div>
            <div class="row h-50 align-items-center">
                <div class="col-1 d-flex justify-content-end fs-3">
                    Result:
                </div>
                <div id="idEncResult" class="col-11 exact font-monospace fs-3"></div>
            </div>
        </div>

        <!-- Decoding -->
        <div class="row justify-content-between py-2">
            <div class="col-2">
                <span class="fs-4 fw-bolder" style="padding-right: 10px;">Decoding: </span>
                <span id="idDecText" class="font-monospace fs-4 exact"></span>
            </div>
            <div class="col-2 d-flex justify-content-end">
                <button id="idDecBtnNext" type="button" class="btn btn-primary btn-lg px-4">Next</button>
                <button id="idDecBtnSkip" type="button" class="btn btn-primary btn-lg px-4" style="margin-left: 15px">Skip</button>
            </div>
        </div>
        <div class="RL" style="background-color: rgb(250, 247, 209);">
            <div class="row h-50 align-items-center">
                <div class="col-1 d-flex justify-content-end fs-3">
                    Input:
                </div>
                <div id="idDecInput" class="col-11 exact font-monospace" style="font-size: 30px;"></div>
            </div>
            <div class="row h-50 align-items-center">
                <div class="col-1 d-flex justify-content-end fs-3">
                    Result:
                </div>
                <div id="idDecResult" class="col-11 exact fs-3 font-monospace"></div>
            </div>
        </div>
        `;
    } 

    finish() {
        document.getElementById("resultBoxInput").innerText = this.savedInput;
        document.getElementById("resultBoxOutput").innerText = this.encOutput.replaceAll("©", "");
        let inputBits = this.savedInput.length*8;
        let inputBPC = 8;
        let outputBits = this.encOutput.split("©").length*16;
        let outputsBPC = Math.round((outputBits/this.savedInput.length)*100)/100;

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