import { MinHeap } from "../class/MinHeap";

export type BinNode<T> = {
    parent: BinNode<T> | null;
    left_child: BinNode<T> | null;
    right_child: BinNode<T> | null;
    data: T;
}

export function huffman_tree(input: string): BinNode<{ code?: number, count: number }> {
    const counters: number[] = Array(256).fill(0);
    for (const char of input) counters[char.codePointAt(0)]++;
    const heap = new MinHeap<BinNode<{ code?: number, count: number }>>(x => x.data.count);
    heap.insert(...counters.map((count, code) => ({
        parent: null,
        left_child: null,
        right_child: null,
        data: {
            count,
            code
        }
    })).filter(({ data }) => data.count > 0));
    let node1, node2;
    while ((node1 = heap.pop()) && (node2 = heap.pop())) {
        const node: BinNode<{ code?: number, count: number }> = {
            parent: null,
            left_child: node1,
            right_child: node2,
            data: {
                count: node1.data.count + node2.data.count
            }
        }
        node1.parent = node;
        node2.parent = node;
        heap.insert(node);
    }
    return node1;
}

export function canonical_huffman_table(input: string): [Map<number, string>, Map<number, string>] {
    const tree = huffman_tree(input);
    const encoding: { code: number, encoding: string }[] = [];
    const stack: { partial_code: string[], node: BinNode<{ code?: number, count: number }> }[] = [{
        partial_code: [],
        node: tree
    }];
    let stack_el;
    while (stack_el = stack.pop()) {
        const { partial_code, node } = stack_el;
        if (typeof node.data.code === "number") {
            encoding.push({ code: node.data.code, encoding: partial_code.join("") });
            continue;
        }
        stack.push({ partial_code: partial_code.concat(["0"]), node: node.left_child });
        stack.push({ partial_code: partial_code.concat(["1"]), node: node.right_child });
    }
    encoding.sort(({ code, encoding }, { code: code2, encoding: encoding2 }) =>
        encoding.length === encoding2.length ?
            code - code2 :
            encoding.length - encoding2.length
    );
    const canonical_encoding = new Map<number, string>();
    let prev_l = 0;
    let enc_value = 0;
    for (const enc of encoding) {
        const canonical = enc_value.toString(2).padStart(prev_l, "0").padEnd(enc.encoding.length, "0");
        canonical_encoding.set(enc.code, canonical);
        enc_value = parseInt(canonical, 2) + 1;
        prev_l = canonical.length;
    }
    return [new Map(encoding.map(({ code, encoding }) => [code, encoding])), canonical_encoding];
}

export function huffman_enc(input: string): string {
    const out_arr: string[] = [];
    const ascii_arr: number[] = [];
    const [_, table] = canonical_huffman_table(input);
    for (let i = 0; i < 0x100; i++) {
        ascii_arr.push(table.get(i)?.length ?? 0);
    }
    for (const char of input) {
        out_arr.push(table.get(char.charCodeAt(0)));
    }
    const out = out_arr.join("");
    for (let i = 0; i < out.length; i += 8) {
        ascii_arr.push(parseInt(out.slice(i, i + 8).padEnd(8, "0"), 2));
    }
    ascii_arr.push(out.length % 8);
    return ascii_arr.map(ascii => String.fromCharCode(ascii)).join("");
}
