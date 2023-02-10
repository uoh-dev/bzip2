import { LinkedList } from "../class";

const $ = 0x100;

export function inverse_burrows_wheeler(input: string): string {
    const input_arr: number[] = input.split("").map((c) => c.charCodeAt(0));
    const $_ptr_arr = [];
    let k = 0;
    while (input_arr[k] !== 0xFF) $_ptr_arr.push(input_arr[k++]);
    k++;
    const $_ptr = $_ptr_arr.reduce((prev, curr) => prev * 128 + curr, 0);
    const in_arr_$: number[] = [].concat(input_arr.slice(k, k + $_ptr), $, input_arr.slice(k + $_ptr));
    const fn_pre = in_arr_$.map((code, index) => ({ code, index }));
    fn_pre.sort(({ code: c1 }, { code: c2 }) => c1 - c2);
    const f: number[] = Array.from({ length: fn_pre.length });
    fn_pre.forEach(({ index }, i) => f[index] = i);
    let c = in_arr_$.indexOf($);
    const res = [];
    while ((c = f[c]) !== $_ptr) res.push(in_arr_$[c]);
    return res.reverse().map((code) => String.fromCharCode(code)).join("");
}
