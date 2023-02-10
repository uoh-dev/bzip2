import { LinkedList } from "../class/LinkedList"

export function move_to_front_dec(input: string): string {
    const ascii_arr: string[] = input.slice(0, 256).split("");
    const ascii_list: LinkedList<string> = new LinkedList();
    for (const char of ascii_arr) ascii_list.append(char);
    const enc_input = input.slice(256).split("").map(v => v.charCodeAt(0));
    const dec_input_arr = Array(enc_input.length);
    for (let i = enc_input.length - 1; i >= 0; i--) {
        const prev_index = enc_input[i];
        const char = ascii_list.at(0);
        ascii_list.remove_head();
        ascii_list.insert(char, prev_index);
        dec_input_arr[i] = char;
    }
    return dec_input_arr.join("");
}
