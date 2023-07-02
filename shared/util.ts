
export function requireNonNull<T>(obj: T | null): T {
    if (obj != null) {
        return obj;
    }
    throw TypeError(`unexpected null`);
}

export function createElementFromHTML<E extends Element>(text: string): E {
    const elem = document.createElement("div");
    elem.innerHTML = text;
    setTimeout(() => elem.remove());
    return elem.children[0] as E;
}

export function isDOMConnected(node?: Node) {
    if (node) {
        return node.isConnected;
    }
    return false;
}