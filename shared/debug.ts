import { formatString } from "./format";

interface DebugCategory {
    name: string;
    color: string;
}

export class DebugConsole {
    #id = "debug";
    #messageFormat = "%c[${{ id }}] [${{ category }}] ${{ message }}";
    #category: DebugCategory[] = [];

    constructor (id: string, { messageFormat }: { messageFormat?: string } = {}) {
        this.#id = id;
        this.#messageFormat = this.#messageFormat ??  messageFormat;
    }

    addCategory(cat: DebugCategory) {
        this.#category.push(cat);
    }

    printMessage(message: string): void;
    printMessage(category: string, message: string): void;
    printMessage(arg0: string, arg1?: string): void {
        if (arg1) {
            const category = this.#category.find(i => i.name == arg0);
            
            if (!category) return;

            console.log(formatString(this.#messageFormat, {
                id: this.#id,
                category: category.name
            }), `color: ${category.name}`);
        }
        else {
            console.log(formatString(this.#messageFormat, {
                id: this.#id,
                category: "unknown" 
            }), `color: initial`);
        }
    }
}