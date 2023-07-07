
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

export const HTMLEntityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
} as const;

export function escapeHTML(text: string) {
    // @ts-ignore
    return text.replace(/[&<>"'`=\/]/g, (s: string) => HTMLEntityMap[s]);
}
  

export function html<E extends Element>(template: readonly string[], ...subst: any[]) {
    const completeString = [];

    for (let i = 0; i < template.length; i++) {
        completeString.push(template[i]);
        if (subst[i]) completeString.push(escapeHTML(String(subst[i])));
    }

    return fromHTML<E>(completeString.join(""));
}