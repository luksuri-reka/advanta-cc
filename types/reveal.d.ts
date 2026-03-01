declare module 'reveal.js' {
    interface RevealOptions {
        hash?: boolean;
        transition?: string;
        backgroundTransition?: string;
        controls?: boolean;
        progress?: boolean;
        center?: boolean;
        width?: number | string;
        height?: number | string;
        margin?: number;
        slideNumber?: boolean | string;
        autoSlide?: number;
        loop?: boolean;
        plugins?: unknown[];
    }

    class Reveal {
        constructor(container: HTMLElement, options?: RevealOptions);
        initialize(): Promise<void>;
        destroy(): void;
        slide(h: number, v?: number, f?: number): void;
        next(): void;
        prev(): void;
        navigateRight(): void;
        navigateLeft(): void;
        getState(): object;
        setState(state: object): void;
        on(type: string, listener: EventListener): void;
        off(type: string, listener: EventListener): void;
    }

    export default Reveal;
}

declare module 'reveal.js/dist/reveal.css' { }
declare module 'reveal.js/dist/theme/moon.css' { }
declare module 'reveal.js/dist/theme/black.css' { }
declare module 'reveal.js/dist/theme/night.css' { }
