const $ = 0x100;

export function rot_lexic_cmp(inp: number[]): (rot1: number, rot2: number) => number {
    return (rot1, rot2) => {
        for (let k = 0; k < inp.length; k++) {
            const l = inp[(rot1 + k) % inp.length];
            const r = inp[(rot2 + k) % inp.length];
            if (l !== r) return l - r;
        }
        return 0;
    };
}

export function burrows_wheeler_transform(input: string): string {
    const input_arr: number[] = input.split("").map((c) => c.charCodeAt(0));
    input_arr.push($);
    const rotations = Array.from({ length: input_arr.length }, (_, i) => i);
    rotations.sort(rot_lexic_cmp(input_arr));
    const out = rotations.map((rot) => input_arr[(rot + input_arr.length - 1) % input_arr.length]);
    const $_ptr = out.indexOf($);
    out.splice($_ptr, 1);
    const $_out: number[] = []
    const $_ptr_bin = $_ptr.toString(2).split("").reverse().join("");
    for (let i = 0; i < $_ptr_bin.length; i += 7) {
        $_out.push(parseInt($_ptr_bin.slice(i, i + 7).split("").reverse().join(""), 2));
    }
    $_out.reverse();
    return [].concat($_out, [0xFF], out).map((code) => String.fromCharCode(code)).join("");
}
