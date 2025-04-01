import { type GameEntity } from "@common/utils/entityPool";
import { EntityType } from "@common/constants";
import { Vec2, Vector } from "@common/utils/vector";
import { Game } from "@/scripts/game";
import { Container } from "pixi.js";

export abstract class ClientEntity implements GameEntity {
    readonly game: Game;

    readonly id: number;
    abstract readonly type: EntityType;

    damageable = false;
    destroyed = false;

    container = new Container();

    position: Vector = Vec2.new(0, 0);

    constructor(game: Game, id: number) {
        this.game = game;
        this.id = id;
    }

    abstract update(): void;
}
