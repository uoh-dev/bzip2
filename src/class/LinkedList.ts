export class LinkedList<T> {
    private _head: LinkedListNode<T> | null;
    private _tail: LinkedListNode<T> | null;
    private _size: number;

    constructor() {
        this._head = null;
        this._tail = null;
        this._size = 0;
    }

    at(i: number): T {
        let list = this._head;
        while (i-- > 0) list = list.next;
        return list.data;
    }

    indexOf(data: T): number {
        let i = 0;
        let node = this._head
        do {
            if (node.data === data) return i;
            i++;
        } while (node = node.next);
    }

    private _init(data: T): void {
        this._head = {
            previous: null,
            data,
            next: null
        };
        this._tail = this._head;
        this._size = 1;
    }

    prepend(data: T): void {
        if (!this._head) return this._init(data);
        this._head.previous = {
            previous: null,
            data,
            next: this._head
        };
        this._head = this._head.previous;
        this._size++;
    }

    append(data: T): void {
        if (!this._tail) return this._init(data);
        this._tail.next = {
            previous: this._tail,
            data,
            next: null
        };
        this._tail = this._tail.next;
        this._size++;
    }

    insert(data: T, i: number): void {
        if (i === 0) return this.prepend(data);
        if (i === this._size) return this.append(data);
        let node = this._head;
        while (i-- > 0) {
            node = node.next;
        }
        const newnode: LinkedListNode<T> = {
            previous: node.previous,
            data,
            next: node
        };
        if (node.previous) node.previous.next = newnode;
        node.previous = newnode;
        this._size++;
    }

    remove(i: number): void {
        if (i === 0) return this.remove_head();
        if (i === this._size - 1) return this.remove_tail();
        let node = this._head;
        while (i-- > 0) {
            node = node.next;
        }
        // Assumption: V8 garbage-collects this.
        if (node.next) node.next.previous = node.previous;
        if (node.previous) node.previous.next = node.next;
        this._size--;
    }

    head(): T {
        return this._head.data;
    }

    remove_head(): void {
        if (!this._head) return;
        this._head = this._head.next;
        this._size--;
        if (!this._head) return;
        this._head.previous = null;
    }

    tail(): T {
        return this._tail.data;
    }

    remove_tail(): void {
        if (!this._tail) return;
        this._tail = this._tail.previous;
        this._size--;
        if (!this._tail) return;
        this._tail.next = null;
    }

    

    toArray(): T[] {
        const result = Array(this._size);
        let node = this._head;
        for (let i = 0; i < this._size; i++) {
            result[i] = node.data;
            node = node.next;
        }
        return result;
    }

    size(): number {
        return this._size;
    }
}

type LinkedListNode<T> = {
    previous: LinkedListNode<T> | null;
    data: T;
    next: LinkedListNode<T> | null;
}
