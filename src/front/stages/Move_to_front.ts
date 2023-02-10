import { huffman_enc } from "../../bzip2_enc/huffman_enc";
import { move_to_front_enc } from "../../bzip2_enc/move_to_front_enc";
import { run_length_enc } from "../../bzip2_enc/run_length_enc";
import { sleep } from "../utils";

export interface MTFEncObj {
    alphabet: string, 
    output: number[]
}

export interface MTFDecObj {
    alphabet: string, 
    output: string
}

export class MoveToFront {
    private readonly elParent: HTMLElement;

    private readonly elEncAlphabet: HTMLElement;
    private readonly elEncInput: HTMLElement;
    private readonly elEncResult: HTMLElement;

    private readonly elDecAlphabet: HTMLElement;
    private readonly elDecInput: HTMLElement;
    private readonly elDecResult: HTMLElement;

    private readonly alphabet =' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
    private encSteps: MTFEncObj[];
    private encOutput: string;
    private encStep: number = 0;
    private savedInput: string;

    private decInput: number[];
    private decSteps: MTFDecObj[];
    private decOutput: string;
    private decStep: number = 0;


    private running: boolean = false;


    constructor(input: string, idParent: string){
        this.elParent = document.getElementById(idParent);
        this.elParent.innerHTML = this.getHTML();
        this.savedInput = input;

        this.elEncAlphabet = document.getElementById("idEncAlphabet");
        this.elEncInput = document.getElementById("idEncInput");
        this.elEncResult = document.getElementById("idEncResult");

        this.elDecAlphabet = document.getElementById("idDecAlphabet");
        this.elDecInput = document.getElementById("idDecInput");
        this.elDecResult = document.getElementById("idDecResult");

        this.elEncAlphabet.innerText = this.alphabet;
        this.elDecAlphabet.innerText = this.alphabet;
        this.elEncInput.innerText = input;

        this.encSteps = this.getEncSteps(input);
        this.encSteps = this.encSteps.slice(1, this.encSteps.length)
        this.encOutput = this.encSteps[this.encSteps.length-1].output.join("©");
    }

    setDec() { 
        this.decInput = this.encOutput.split("©").map((index) => parseInt(index));
        this.decSteps = this.getDecSteps(this.encOutput);
        this.decSteps = this.decSteps.slice(1, this.decSteps.length);
        this.decOutput = this.decSteps[this.decSteps.length-1].output;


        this.elDecInput.innerText = this.decInput.join(" ");
    }

    getEncSteps(input: string): MTFEncObj[] {
        let results: MTFEncObj[] = [{alphabet: this.alphabet, output: []}];
        [...input].forEach((letter) => {
            results.push({
                alphabet: letter + results[results.length-1].alphabet.split(letter).join(""),
                output: results[results.length-1].output.concat([results[results.length-1].alphabet.indexOf(letter)]) 
            });
        });
        return results;
    }

    getDecSteps(input: string): MTFDecObj[] {
        let results: MTFDecObj[] = [{alphabet: this.alphabet, output: ""}];
        input.split("©").forEach((index) => {
            let letter = results[results.length-1].alphabet[parseInt(index)];
            results.push({
                alphabet: letter + results[results.length-1].alphabet.split(letter).join(""),
                output: results[results.length-1].output.concat(letter) 
            });
        });
        return results;
    }

    async nextEncStep(): Promise<void> {
        if (this.running || this.encSteps.length == 0) return;
        let letters = this.elEncAlphabet.innerText;
        let letterIndex = this.encSteps[0].output[this.encStep];
        this.running = true;
        
        this.elEncAlphabet.innerHTML = "";
        let elements = [document.createElement("div"), document.createElement("div"), document.createElement("div")];
        let sections = [letters.slice(0, letterIndex), letters[letterIndex], letters.slice(letterIndex + 1, letters.length)];
        elements.forEach((el, index) => el.innerHTML = sections[index]);
        elements.forEach(el => el.setAttribute("class", "letterMTF"));
        elements.forEach(el => this.elEncAlphabet.appendChild(el));

        let distance1: number = Math.abs(elements[1].offsetLeft - elements[2].offsetLeft);
        let distance2: number = Math.abs(elements[0].offsetLeft - elements[1].offsetLeft);
        elements[1].classList.add("highlight");
        await sleep((letterIndex == 0) ? 0 : 700);
        if (letterIndex != 0){
            elements[0].style.transform = `translate(${distance1}px, 0)`;
            elements[1].style.transform = `translate(${distance2 * (-1)}px, 0)`;
        }
        await sleep((letterIndex == 0) ? 800 : 700);
        elements[1].classList.remove("highlight");
        await sleep(500)
        this.elEncAlphabet.innerText = this.encSteps[0].alphabet;
        this.running = false;
        this.elEncResult.innerText = this.encSteps[0].output.join(" ");
        this.encSteps.shift();
        this.encStep++;
        if (this.encSteps.length == 0) {
            this.setDec();
        }
    }

    skipEncSteps() {
        if (this.running || this.encSteps.length == 0) return;
        this.elEncAlphabet.innerText = this.encSteps[this.encSteps.length-1].alphabet;
        this.elEncResult.innerText = this.encSteps[this.encSteps.length-1].output.join(" ");
        this.encSteps = [];
        this.setDec();
    }

    async nextDecStep(): Promise<void> {
        if (this.running || this.decSteps.length == 0) return;
        let letters = this.elDecAlphabet.innerText;
        let letterIndex = this.decInput[this.decStep];
        this.running = true;
        
        this.elDecAlphabet.innerHTML = "";
        let elements = [document.createElement("div"), document.createElement("div"), document.createElement("div")];
        let sections = [letters.slice(0, letterIndex), letters[letterIndex], letters.slice(letterIndex + 1, letters.length)];
        elements.forEach((el, index) => el.innerHTML = sections[index]);
        elements.forEach(el => el.setAttribute("class", "letterMTF"));
        elements.forEach(el => this.elDecAlphabet.appendChild(el));
        

        let before = this.decInput.slice(0, this.decStep).join(" ");
        if (before.length>0) before = before + " ";
        this.elDecInput.innerHTML = before + `<div id="currentMTFDec" class="letterMTF">${letterIndex}</div> `  
                                 + this.decInput.slice(this.decStep+1, this.decInput.length).join(" ");
        document.getElementById("currentMTFDec").style.color = "blue";
        document.getElementById("currentMTFDec").style.fontWeight = "bolder";
        await sleep(500);
        elements[1].style.color = "blue";
        elements[1].style.fontWeight = "bolder";
        await sleep(1000);
        elements[1].style.color = "";
        elements[1].style.fontWeight = "";
        let distance1: number = Math.abs(elements[1].offsetLeft - elements[2].offsetLeft);
        let distance2: number = Math.abs(elements[0].offsetLeft - elements[1].offsetLeft);
        elements[1].classList.add("highlight");
        await sleep((letterIndex == 0) ? 0 : 700);
        if (letterIndex != 0){
            elements[0].style.transform = `translate(${distance1}px, 0)`;
            elements[1].style.transform = `translate(${distance2 * (-1)}px, 0)`;
        }
        await sleep((letterIndex == 0) ? 800 : 700);
        elements[1].classList.remove("highlight");
        await sleep(500)
        document.getElementById("currentMTFDec").style.color = "";
        document.getElementById("currentMTFDec").style.fontWeight = "";
        this.elDecAlphabet.innerText = this.decSteps[0].alphabet;
        this.elDecResult.innerText = this.decSteps[0].output;
        this.decSteps.shift();
        this.decStep++;
        this.running = false;
        if (this.decSteps.length == 0) {
            this.decFinish()
        }
    }

    skipDecSteps(): void {
        if (this.running || this.decSteps.length == 0) return;
        this.elDecAlphabet.innerText = this.decSteps[this.decSteps.length-1].alphabet;
        this.elDecResult.innerText = this.decSteps[this.decSteps.length-1].output;
        this.decSteps = [];
        this.decFinish();
    }

    decFinish() { 
        document.getElementById("btnFinish").style.display = "";
    }

    getHTML() {
        return /*HTML*/`
        <div class="row py-2">
            <div class="col-8 me-auto">
                <span class="fs-4 fw-bolder" style="padding-right: 10px;">Encoding: </span>
            </div>
            <div class="col-4 d-flex justify-content-end">
                <button id="idEncBtnNext" type="button" class="btn btn-primary btn-lg px-4">Next</button>
                <button id="idEncBtnSkip" type="button" class="btn btn-primary btn-lg px-4" style="margin-left: 15px">Skip</button>
            </div>
        </div>
        <div class="d-flex justify-content-center d-flex align-items-center alphabet"  style="background-color: rgb(209, 209, 250);">
            <div id="idEncAlphabet" class="fs-3 font-monospace exact" style=""></div>
        </div>
        <div class="fs-4 exact font-monospace pb-3">Eingabe: <span id="idEncInput"></span></div>
        <div class="fs-4 exact font-monospace pb-3"> Result: <span id="idEncResult"></span></div>

        <div class="row justify-content-between py-2">
            <div class="col-2">
                <span class="fs-4 fw-bolder" style="padding-right: 10px;">Decoding: </span>
            </div>
            <div class="col-2 d-flex justify-content-end">
                <button id="idDecBtnNext" type="button" class="btn btn-primary btn-lg px-4">Next</button>
                <button id="idDecBtnSkip" type="button" class="btn btn-primary btn-lg px-4" style="margin-left: 15px">Skip</button>
            </div>
        </div>
        <div class="d-flex justify-content-center d-flex align-items-center alphabet"  style="background-color: rgb(250, 247, 209);">
            <div id="idDecAlphabet" class="fs-3 font-monospace exact" style=""></div>
        </div>
        <div class="fs-4 exact font-monospace pb-3">Eingabe: <span id="idDecInput"></span></div>
        <div class="fs-4 exact font-monospace"> Result: <span id="idDecResult"></span></div>
        `;
    }
    
    finish() {

        document.getElementById("resultBoxInput").innerText = this.savedInput;
        document.getElementById("resultBoxOutput").innerText = this.encOutput.replaceAll("©", " ");
        let inputBits = this.savedInput.length*8;
        let outputBits = this.encOutput.split("©").length*8;
        let inputHM = (huffman_enc(this.savedInput).slice(256).length-1)*8;
        let outputHM = (huffman_enc(move_to_front_enc(this.savedInput).slice(256)).slice(256).length-1)*8;
        let inputRL = run_length_enc(this.savedInput).length*8;
        let outputRL = run_length_enc(move_to_front_enc(this.savedInput).slice(256)).length*8;

        document.getElementById("inputStats").innerHTML = /*HTML*/ `
            <tr>
                <th>Bits</th>
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