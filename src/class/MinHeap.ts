const parent_of = (i: number) => i % 2 === 0 ? (i - 2) / 2 : (i - 1) / 2;
const left_child = (i: number) => 2 * i + 1;
const right_child = (i: number) => 2 * i + 2;

export class MinHeap<T> {
    private rank_function: (data: T) => number;
    private heap: T[];
    
    constructor(rank_fn: (data: T) => number) {
        this.rank_function = rank_fn;
        this.heap = [];
    }

    private rank(i: number): number {
        if (i < 0) return -Infinity;
        else if (i >= this.heap.length) return Infinity;
        return this.rank_function(this.heap[i]);
    }

    private bump(i: number): void {
        const rank = this.rank(i);
        let bump_i = i;
        let compare_i;
        while (this.rank(compare_i = parent_of(bump_i)) > rank) {
            this.swap(compare_i, bump_i);
            bump_i = compare_i;
        }
    }

    private pmub(i: number): void {
        const rank = this.rank(i);
        let pmub_i = i;
        let lc = left_child(pmub_i);
        let rc = right_child(pmub_i);
        let lc_rank = this.rank(lc);
        let rc_rank = this.rank(rc);
        while (lc_rank < rank || rc_rank < rank) {
            if (lc_rank < rc_rank) {
                this.swap(lc, pmub_i);
                pmub_i = lc;
            } else {
                this.swap(rc, pmub_i);
                pmub_i = rc;
            }
            lc_rank = this.rank(lc = left_child(pmub_i));
            rc_rank = this.rank(rc = right_child(pmub_i));
        }
    }

    private swap(i: number, j: number): void {
        const val_i = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = val_i;
    }

    insert(...datas: T[]): void {
        for (const data of datas) {
            this.heap.push(data);
            this.bump(this.heap.length - 1);
        }
    }

    pop(): T {
        this.swap(0, this.heap.length - 1);
        const res = this.heap.pop();
        if (this.heap.length > 1) this.pmub(0);
        return res;
    }

    // Warning: potentially unsafe to heap structure. Should not be altered.
    toArray(): readonly T[] {
        return Array.from(this.heap);
    }
}
