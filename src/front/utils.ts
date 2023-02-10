export enum Stages {
    RUN_LENGTH,
    BURROWS_WHEELER, 
    MOVE_TO_FRONT, 
    HUFFMAN
}

export function sleep(ms: number){
    return new Promise((r) => setTimeout(r, ms));
} 
