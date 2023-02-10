//import { addTestEvents } from "./front/test";
import Stepper from "bs-stepper";
import { BurrowsWheeler } from "./front/stages/Burrows_wheeler";
import { RunLength } from "./front/stages/Run_length";
import { MoveToFront } from "./front/stages/Move_to_front";
import { Huffman } from "./front/stages/Huffman";
import { run_length_enc } from "./bzip2_enc/run_length_enc";
import { burrows_wheeler_transform } from "./bzip2_enc/burrows_wheeler_transform";
import { move_to_front_enc } from "./bzip2_enc/move_to_front_enc";
import { huffman_enc } from "./bzip2_enc/huffman_enc";
import { Stages } from "./front/utils";
import Sortable, { Swap } from "sortablejs";
import { run_length_dec } from "./bzip2_dec/run_length_dec";
import { inverse_burrows_wheeler } from "./bzip2_dec/inverse_burrows_wheeler";
import { move_to_front_dec } from "./bzip2_dec/move_to_front_dec";
import { huffman_dec } from "./bzip2_dec/huffman_dec";


let labels = ["Run-length encoding", "Burrows-Wheeler transform", "Move-to-front", "Huffman coding"];
let ids = ["RL", "BWT", "MTF", "HM"];
let fileExists: boolean = false;

async function addIndexEvents() {

    function insertStage(value: number, input: string) {
        let stage: any;
        switch (value){
            case Stages.RUN_LENGTH:
                stage = new RunLength(input, "divContent");
                document.getElementById("spanTitle").innerText = "Run-length encoding";
                document.getElementById("idEncBtnNext").addEventListener("click", () => stage.nextEncStep());
                document.getElementById("idEncBtnSkip").addEventListener("click", () => stage.skipEncSteps());
                document.getElementById("idDecBtnNext").addEventListener("click", () => stage.nextDecStep());
                document.getElementById("idDecBtnSkip").addEventListener("click", () => stage.skipDecSteps());
                break;
            case Stages.BURROWS_WHEELER:
                stage = new BurrowsWheeler(input, "divContent");
                let stepperBWT: Stepper;
                stepperBWT = new Stepper(document.getElementById('stepper'), {
                    linear: false,
                    animation: true,
                    selectors: {
                        steps: '.step',
                        trigger: '.step-trigger',
                        stepper: '#stepper'
                    }
                });
                document.getElementById("spanTitle").innerText = "Burrows-Wheeler transform";
                document.getElementById("stepper").addEventListener("show.bs-stepper", (event: any) => {
                    stage.nextEncStep(event.detail.indexStep);
                    for (let i = 1; i <= 4; i++){
                        document.getElementById(`circle${(i)}`).style.backgroundColor = (i <= event.detail.indexStep + 1) ? "#0d6efd" : "darkgrey";
                    }
                })
                document.getElementById("idEncBtnNext").addEventListener("click", () => stepperBWT.next());
                break;
            case Stages.MOVE_TO_FRONT:
                stage = new MoveToFront(input, "divContent");
                document.getElementById("spanTitle").innerText = "Move-to-front transform";
                document.getElementById("idEncBtnNext").addEventListener("click", () => stage.nextEncStep());
                document.getElementById("idEncBtnSkip").addEventListener("click", () => stage.skipEncSteps());
                document.getElementById("idDecBtnNext").addEventListener("click", () => stage.nextDecStep());
                document.getElementById("idDecBtnSkip").addEventListener("click", () => stage.skipDecSteps());
                break;
            case Stages.HUFFMAN:
                stage = new Huffman(input, "divContent");   
                document.getElementById("spanTitle").innerText = "Huffman encoding";
                document.getElementById("idEncBtnNext").addEventListener("click", () => stage.nextTreeStep());
                document.getElementById("idEncBtnSkip").addEventListener("click", () => stage.skipTreeSteps());
                
                break;
            default:
                throw new Error("Unhandled encoding stage value.");
        }   
    
        document.getElementById("btnFinish").addEventListener("click", () => {
            stage.finish();
            document.getElementById("resultScreen").style.display = "";
            document.getElementById("resultScreen").scrollIntoView({ block: "end", inline: "nearest", behavior: "smooth" });
    
        });
    
    }
    
    function handleLength(){
        if (fileExists) {
            (document.getElementById("buttonEncode") as HTMLButtonElement).disabled = false;
            document.getElementById("buttonEncode").classList.add("btn-primary");
            document.getElementById("buttonEncode").classList.remove("btn-danger");
            return;
        }
        let value = parseInt((document.getElementById("selectEnc") as HTMLOptionElement).value);
        let letterCount = (<HTMLTextAreaElement>document.getElementById("textareaEnc")).value.length;
        let maxLength: number;
        if (value != -1) {
            switch (value){
                case Stages.RUN_LENGTH:
                    maxLength = 29;
                    break;
                case Stages.BURROWS_WHEELER:
                    maxLength = 38;
                    break;
                case Stages.MOVE_TO_FRONT:
                    maxLength = 37;
                    break;
                case Stages.HUFFMAN:
                    maxLength = 31;
                    break;
                default:
                    throw new Error("Unhandled encoding step value.");
            }
        } 
        if (value == 3) {
            (document.getElementById("buttonEncode") as HTMLButtonElement).disabled = !(
                (letterCount > 0) 
                && ((new Set((<HTMLTextAreaElement>document.getElementById("textareaEnc")).value)).size < maxLength)
                && (letterCount < 48)
            ); 
        } else {
            (document.getElementById("buttonEncode") as HTMLButtonElement).disabled = !((letterCount > 0) && (letterCount < maxLength)); 
        }
        if ((document.getElementById("buttonEncode") as HTMLButtonElement).disabled) {
            document.getElementById("buttonEncode").classList.remove("btn-primary");
            document.getElementById("buttonEncode").classList.add("btn-danger");
        } else {
            document.getElementById("buttonEncode").classList.add("btn-primary");
            document.getElementById("buttonEncode").classList.remove("btn-danger");
        }
        document.getElementById("spanCountLetters").style.color = ((document.getElementById("buttonEncode") as HTMLButtonElement).disabled) ? "red" : "white";
    }
    
    async function checkFile(fileEl: HTMLInputElement) {
        if (fileEl.files.length != 0 && (await fileEl.files[0].text()).length > 0) {
            if ((await fileEl.files[0].text()).length < 29){
                return true;
            } else {
                alert("File is too big (must have under 29 characters)");
                (<HTMLInputElement>document.getElementById("inputFile")).value ='';  
                fileExists = true;
                handleLength()
                return false;
            }
        }
        alert("File does not exist or is empty");
        (<HTMLInputElement>document.getElementById("inputFile")).value ='';  
        return false;
    }
    
    const textareaEnc = <HTMLTextAreaElement>document.getElementById("textareaEnc");

    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById("spanCountLetters").textContent = textareaEnc.value.length.toString();
        (<HTMLInputElement>document.getElementById("inputFile")).value ='';  
        handleLength();
    });

    document.getElementById("inputFile").addEventListener("change", async () => {
        fileExists = await checkFile(<HTMLInputElement>document.getElementById("inputFile"));
        handleLength();
    });

    textareaEnc.addEventListener("input", () => {
        textareaEnc.value = textareaEnc.value.replaceAll("\n", "");
        document.getElementById("spanCountLetters").textContent = textareaEnc.value.length.toString() ;
        handleLength();
    });

    document.getElementById("selectEnc").addEventListener("change", () => handleLength());

    document.getElementById("buttonEncode").addEventListener("click", async () => {
        handleLength();
        let value = parseInt((document.getElementById("selectEnc") as HTMLOptionElement).value);
        let input = textareaEnc.value;
        const fileEl = (<HTMLInputElement>document.getElementById("inputFile"));
        if (fileEl.files.length > 0 && await checkFile(fileEl)) {
            input = (await fileEl.files[0].text());
        }
        insertStage(value, input);
        
        document.getElementById("rowImg").style.height = "180px";
        document.getElementById("c1").click();
        document.getElementById("c2").click();
    });

    /*
    function decode(input: string, order: number[] = [3,2,1,0]): string {
        for (let value of order) {
            switch (value) {
                case Stages.RUN_LENGTH: 
                    input = run_length_dec(input);
                    break;
                case Stages.BURROWS_WHEELER:
                    input = inverse_burrows_wheeler(input);
                    break;
                case Stages.MOVE_TO_FRONT: 
                    input = move_to_front_dec(input);
                    break;
                case Stages.HUFFMAN: 
                    input = huffman_dec(input);
                    break;
                default:
                    throw new Error("Unhandled encoding stage value.");
            }
            console.log(labels[value], input.length);
        }
        return input;
    }

    function download(filename: string, text: string) {
        let el = document.createElement('a');
        el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        el.setAttribute('download', filename);
    
        el.style.display = 'none';
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
    }

    document.getElementById("sicherButton").addEventListener("click", async () => {
        const fileEl = (<HTMLInputElement>document.getElementById("sicherFile"));
        let res = decode(await fileEl.files[0].text());
        console.log(res.length)
        download("decoded.txt", res);
    })
    */
}

function addCustomOrderEvents() {

    let list: Sortable;

    function encode(input: string, order: number[]): string {
        for (let value of order) {
            switch (value) {
                case Stages.RUN_LENGTH: 
                    input = run_length_enc(input);
                    break;
                case Stages.BURROWS_WHEELER:
                    input = burrows_wheeler_transform(input);
                    break;
                case Stages.MOVE_TO_FRONT: 
                    input = move_to_front_enc(input);
                    break;
                case Stages.HUFFMAN: 
                    input = huffman_enc(input);
                    break;
                default:
                    throw new Error("Unhandled encoding stage value.");
            }
        }
        return input;
    }

    function download(filename: string, text: string) {
        let el = document.createElement('a');
        el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        el.setAttribute('download', filename);
    
        el.style.display = 'none';
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
    }

    function resetListGroup() {
        let listGroup = document.getElementsByClassName("item");
        while (listGroup.length > 0) {
            listGroup[0].remove();
        }

        for (let i = 0; i < 4; i++) {
            let el = document.createElement("div");
            el.classList.add("list-group-item", "item");
            el.setAttribute("enc_id", i+"");
            el.innerHTML = /*HTML*/ `
                ${labels[i]}
                <button id="encStage${i}" type="button" class="btn btn-danger btn-sm float-end d-inline-flex align-items-center" style="height: 24px;">x</button>
            `;
            document.getElementById("listEncPipeline").appendChild(el);
        }

        listGroup = document.getElementsByClassName("item");
        for (let i = 0; i < listGroup.length; i++){ 
            let button = document.getElementById("encStage"+i);
            button.addEventListener("click", () => button.parentElement.remove());
        }
    }

    async function insertResults(input: string, output: string, order: number[]) {
        let inputBits = input.length*8;
        let outputBits = output.length*8;
        let inputBPC = 8;
        let outputsBPC = Math.round((outputBits/input.length)*100)/100;

        let savedBitsRel = Math.round(((1- outputBits/inputBits)*100)*10)/10;
        let savedBPC = Math.round((inputBPC-outputsBPC)*100)/100;

        document.getElementById("inputStats").innerHTML = /*HTML*/ `
            <tr>
                <th>Bits</th>
                <th>${inputBits}</th>
            </tr>
            <tr>
                <th>Bits per character</th>
                <th>${inputBPC}</th>
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

        let resultList = document.getElementById("stageTable");
        for (let stage of order) {
            resultList.innerHTML += `
                <tr>
                    <th>${labels[stage]}</th>
                </tr>
            `;
        }
    }


    document.addEventListener('DOMContentLoaded', () => {
        Sortable.mount(new Swap())
        list = new Sortable(document.getElementById("listEncPipeline"), {
            animation: 150,
            draggable: ".item",
            filter: '.filtered',
            swap: true,
            swapClass: "swapping",
        });
        let listGroup = document.getElementsByClassName("list-group-item");
        for (let i = 0; i < listGroup.length; i++){ 
            let button = document.getElementById("encStage"+i);
            button.addEventListener("click", () => button.parentElement.remove());
        }
        (<HTMLInputElement>document.getElementById("inputFile")).value ='';        
    });
    document.getElementById("buttonDefault").addEventListener("click", resetListGroup);

    for (let i = 0; i < 4; i++) {
        document.getElementById("drop"+ids[i]).addEventListener("click", () => {
            let idCount = document.getElementsByClassName("item").length;
            let el = document.createElement("div");
            el.classList.add("list-group-item", "item");
            el.setAttribute("enc_id", i+"");
            el.innerHTML = /*HTML*/ `
                ${labels[i]}
                <button id="encStage${idCount}" type="button" class="btn btn-danger btn-sm float-end d-inline-flex align-items-center" style="height: 24px;">x</button>
            `;
            document.getElementById("listEncPipeline").appendChild(el);
            document.getElementById(`encStage${idCount}`).addEventListener("click", () => document.getElementById(`encStage${idCount}`).parentElement.remove());
        });
    }
    
    document.getElementById("buttonEncode").addEventListener("click", async () => {       
        let input = (<HTMLTextAreaElement>document.getElementById("textareaEnc")).value;
        const fileEl = (<HTMLInputElement>document.getElementById("inputFile"));
        
        if (fileEl.files.length != 0 && (await fileEl.files[0].text()).length > 0) {
            input = (await fileEl.files[0].text());
        }
        if (input.length == 0) {
            alert("Please enter a text or select a file to encode.");
            return;
        }

        let listGroup = document.getElementsByClassName("list-group-item");
        let order: number[] = [];
        for (let i = 0; i < listGroup.length; i++){ 
            order.push(parseInt(listGroup.item(i).getAttribute("enc_id")));
        }

        let realInput = "";
        let x = input;
        for (let i of x) {
            if (i.charCodeAt(0) <= 255) {
                realInput += i;
            }
        }

        let output = encode(realInput, order);
        insertResults(realInput, output, order);

        document.getElementById("buttonDownload").addEventListener("click", () => {
            download("output.txt", output);
        });

        document.getElementById("spanTitle").innerText = "Encoding result";
        document.getElementById("rowImg").style.height = "180px";
        document.getElementById("c1").click();
        document.getElementById("c2").click();
    });    
}

if (document.getElementById("indexPage")) {
    addIndexEvents();
} 
else if (document.getElementById("customOrderPage")) {
    addCustomOrderEvents();
}


//addTestEvents();

