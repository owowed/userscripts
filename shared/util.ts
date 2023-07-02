
export function requireNonNull<T>(obj: T | null): Exclude<T, undefined | null> {
    if (obj != null && obj != undefined) {
        return obj as Exclude<T, undefined | null>;
    }
    throw TypeError(`unexpected null`);
}

export function fromHTML<E extends Element>(text: string): E {
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