const { ccclass } = cc._decorator;

interface CallBack {
    callbackId: string;
    callback(): void;
}

@ccclass
export default class EventQueueManager {
    private static instance: EventQueueManager;
    private eventQueueList: Map<string, CallBack[]> = new Map();

    static getInstance(): EventQueueManager {
        if (!EventQueueManager.instance) {
            EventQueueManager.instance = new EventQueueManager();
        }

        return EventQueueManager.instance;
    }

    /**
     * return resolved event callbackId
     */
    resolveEvent(name: string, resolveOrder: 'LastToFirst' | 'FirstToLast'): string {
        const eventQueue = this.getEventQueue(name);

        if (eventQueue) {
            let lastEvent = null;

            if (resolveOrder === 'LastToFirst') {
                lastEvent = eventQueue.pop();
            } else if (resolveOrder === 'FirstToLast') {
                lastEvent = eventQueue.shift();
            }

            if (lastEvent) {
                lastEvent.callback();

                return lastEvent.callbackId;
            }
        }
    }

    createEventQueue(name: string) {
        this.eventQueueList.set(name, []);
    }

    getEventQueue(name: string) {
        const eventQueue = this.eventQueueList.get(name);

        if (!eventQueue) {
            console.warn('Event Queue Not Found: ' + eventQueue);

            return;
        }

        return eventQueue;
    }

    getAllEventQueue() {
        return [...this.eventQueueList];
    }

    removeEventQueue(name: string) {
        this.eventQueueList.delete(name);
    }

    removeAllEventQueue() {
        this.eventQueueList = new Map();
    }

    addEvent(name: string, callbackId: string, callback: () => void) {
        const eventQueue = this.getEventQueue(name);

        if (eventQueue) {
            const existing = this.getEventById(name, callbackId);

            if (!existing) {
                const newEvent: CallBack = {
                    callbackId: callbackId,
                    callback: callback,
                };

                eventQueue.push(newEvent);
            }
        }
    }

    getEventById(name: string, callbackId: string) {
        const eventQueue = this.getEventQueue(name);

        if (eventQueue) {
            for (const obj of eventQueue) {
                if (obj.callbackId === callbackId) {
                    return obj;
                }
            }
        }
    }

    removeEventById(name: string, callbackId: string) {
        const eventQueue = this.getEventQueue(name);

        if (eventQueue) {
            for (let i = eventQueue.length - 1; i >= 0; i--) {
                const obj = eventQueue[i];

                if (obj.callbackId === callbackId) {
                    eventQueue.splice(i, 1);

                    break;
                }
            }
        }
    }
}
