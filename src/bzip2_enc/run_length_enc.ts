export function run_length_enc(input: string): string {
    const out: string[] = [];
    let run_value;
    let counter = 0;
    for (const char of input) {
        if (char === run_value && counter < 0xFF) {
            counter++;
            continue;
        }
        out.push(String.fromCharCode(counter) + run_value);
        counter = 1;
        run_value = char;
    }
    out.shift();    
    out.push(String.fromCharCode(counter) + run_value);
    return out.join("");
}
    