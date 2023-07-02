
export function formatString(str: string, dict: Record<string, any>): string {
    return str.replace(/\${{ ([^ ]+) }}/g, (_, varKey) => dict[varKey].toString());
}