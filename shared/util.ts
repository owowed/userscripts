
export function requireNonNull<T>(obj: T | null): Exclude<T, undefined | null> {
    if (obj != null && obj != undefined) {
        return obj as Exclude<T, undefined | null>;
    }
    throw TypeError(`unexpected null`);
}
