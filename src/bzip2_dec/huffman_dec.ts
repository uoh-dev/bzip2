export function huffman_dec(input: string): string {
    const ascii_arr = input.split("").map((c) => c.charCodeAt(0));
    const code_arr = ascii_arr.splice(0, 256).map((codeLength, char) => ({ codeLength, char })).filter(({ codeLength }) => codeLength > 0);
    code_arr.sort(({ codeLength: cl1 }, { codeLength: cl2 }) => cl1 - cl2);
    const table = new Map<string, number>();
    let prev_l = 0;
    let last = -1;
    for (const { char, codeLength } of code_arr) {
        const code = (last + 1).toString(2).padStart(prev_l, "0").padEnd(codeLength, "0");
        table.set(code, char);
        last = parseInt(code, 2);
        prev_l = code.length;
    }
    const last_byte_length = ascii_arr.splice(-1, 1)[0];
    const byte_arr = ascii_arr.map((code) => code.toString(2).padStart(8, "0"));
    byte_arr[byte_arr.length - 1] = ascii_arr[ascii_arr.length - 1].toString(2).padStart(last_byte_length, "0");
    const out = [];
    let buf = "";
    for (const bin of byte_arr.join("")) {
        buf += bin;
        if (table.has(buf)) {
            out.push(table.get(buf));
            buf = "";
        }
    }
    return out.map((code) => String.fromCharCode(code)).join("");
}
