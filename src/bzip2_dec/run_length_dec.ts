export function run_length_dec(input: string): string {
    const out: string[] = [];
    for (let i = 0; i < input.length - 1; i += 2) {
        const counter = input[i].charCodeAt(0);
        const char = input[i + 1];
        out.push(...Array(counter).fill(char));
    }
    return out.join("");
}
