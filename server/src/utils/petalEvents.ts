import { AttributeEvents, AttributeRealize, PetalAttributeRealizes, PetalUsingAnimations } from "./attributeRealizes";
import { ServerPetal } from "../entities/serverPetal";
import { ServerEntity } from "../entities/serverEntity";
import { AttributeNames } from "../../../common/src/definitions/petals";

export type EventFunctionArguments = {
    [K in AttributeEvents] ?: unknown;
} & {
    [AttributeEvents.PETAL_DEAL_DAMAGE] ?: ServerEntity
    [AttributeEvents.FLOWER_DEAL_DAMAGE]?: ServerEntity
    [AttributeEvents.FLOWER_GET_DAMAGE]?: {
        entity: ServerEntity
        damage: number
    }
    [AttributeEvents.PROJECTILE_DEAL_DAMAGE]?: ServerEntity
}

type EventFunction<T extends AttributeEvents = AttributeEvents> =
    (args: EventFunctionArguments[T]) => void;

export type EventInitializer =
    <T extends AttributeEvents = AttributeEvents>(
        on: AttributeEvents,
        func: EventFunction<T>,
        usable?: PetalUsingAnimations
    ) => void;

interface EventData {
    petal: ServerPetal;
    attributeName: AttributeNames;
    event: AttributeEvents;
    callback: EventFunction;
    use?: PetalUsingAnimations;
}

export class PetalEventManager {
    private _attributes_event = new Set<EventData>;
    private _by_event = new Map<string, Set<EventData>>;

    constructor() {
        for (const e in AttributeEvents){
            this._by_event.set(e, new Set<EventData>);
        }
    }

    loadPetal(petal: ServerPetal) {
        for (const name in petal.definition.attributes) {
            this.addAttribute(petal, name as AttributeNames);
        }
    }

    addAttribute(petal: ServerPetal, name: AttributeNames) {
        if (!petal.definition.attributes) return
        const realize = PetalAttributeRealizes[name] as AttributeRealize<typeof name>;
        if (realize.unstackable){
            const finding = Array.from(this._attributes_event)
                .find(x => x.attributeName === name);
            if (finding) return;
        }
        realize.callback(
            this.createEventInitializer(petal, name),
            petal,
            petal.definition.attributes[name]
        );
    }

    createEventInitializer(petal: ServerPetal, name: AttributeNames){
        let em: PetalEventManager = this;
        return function<T extends AttributeEvents>(
            on: AttributeEvents,
            func: EventFunction<T>,
            use?: PetalUsingAnimations
        ) {
            em.addEvent({
                petal: petal,
                attributeName: name,
                event: on,
                callback: func as EventFunction,
                use: use
            });
        };
    }

    addEvent(data: EventData) {
        this._attributes_event.add(data);
        this._by_event.get(data.event as string)?.add(data);
    }

    removePetal(petal: ServerPetal) {
        const petalId = petal.id;
        const array = Array.from(this._attributes_event);
        const findings = array.filter(e => e.petal.id === petalId)
        findings.forEach(e => {
            this._attributes_event.delete(e);
            this._by_event.get(e.event as string)?.delete(e);
        })
    }

    sendEvent<T extends AttributeEvents>(
        event: T, data: EventFunctionArguments[T]
    ) {
        this._by_event.get(event as string)?.forEach((e: EventData) => {
            this.applyEvent(e, data);
        })
    }

    sendEventByPetal<T extends AttributeEvents>(
        petal: ServerPetal, event: T, data: EventFunctionArguments[T]
    ) {
        this._by_event.get(event as string)?.forEach((e: EventData) => {
            if(e.petal.id == petal.id){
                this.applyEvent(e, data);
            }
        })
    }

    applyEvent<T extends AttributeEvents>(
        e: EventData, data: EventFunctionArguments[T]
    ){
        if (e.petal.isLoadingFirstTime || e.use && (!e.petal.canUse || !e.petal.isActive())) return;
        e.callback(data)
        if (e.use){ e.petal.startUsing(e.use)}
    }
}
