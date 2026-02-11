import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class BreadcrumbService {
    private dynamicLabels = signal<Record<string, string>>({});

    setDynamicLabel(segment: string, label: string) {
        this.dynamicLabels.update(labels => ({
            ...labels,
            [segment]: label
        }));
    }

    getDynamicLabel(segment: string): string | null {
        return this.dynamicLabels()[segment] || null;
    }

    clearDynamicLabel(segment: string) {
        this.dynamicLabels.update(labels => {
            const { [segment]: _, ...rest } = labels;
            return rest;
        });
    }

    clearAllDynamicLabels() {
        this.dynamicLabels.set({});
    }
}
