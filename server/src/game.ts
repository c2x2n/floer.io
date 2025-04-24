import { type WebSocket } from "ws";
import { ServerPlayer } from "./entities/serverPlayer";
import {
    ServerEntity
} from "./entities/serverEntity";
import { Grid } from "./grid";
import { EntityPool } from "../../common/src/utils/entityPool";
import { EntityType, GameConstants } from "../../common/src/constants";
import NanoTimer from "nanotimer";
import { type ServerConfig } from "./config";
import { IDAllocator } from "./idAllocator";
import { Vec2, type Vector } from "../../common/src/utils/vector";
import { ServerMob } from "./entities/serverMob";
import { MobDefinition, Mobs } from "../../common/src/definitions/mob";
import { CollisionResponse } from "../../common/src/utils/collision";
import { Random } from "../../common/src/utils/random";
import { CircleHitbox, type Hitbox, RectHitbox } from "../../common/src/utils/hitbox";
import { collideableEntity, isCollideableEntity, isDamageableEntity } from "./typings";
import { PacketStream } from "../../common/src/net";
import { JoinPacket } from "../../common/src/packets/joinPacket";
import { InputPacket } from "../../common/src/packets/inputPacket";
import { PetalDefinition } from "../../common/src/definitions/petal";
import { P2 } from "../../common/src/utils/math";
import { spawnSegmentMobs } from "./utils/mob";
import { Rarity, RarityName } from "../../common/src/definitions/rarity";
import { ChatData } from "../../common/src/packets/updatePacket";
import { ChatPacket } from "../../common/src/packets/chatPacket";
import { MobSpawner, SpecialSpawn, Zone, ZoneName, Zones } from "../../common/src/definitions/zones";

export class Game {
    players = new EntityPool<ServerPlayer>();

    activePlayers = new EntityPool<ServerPlayer>();



    partialDirtyEntities = new Set<ServerEntity>();
    fullDirtyEntities = new Set<ServerEntity>();

    grid = new Grid(GameConstants.maxPosition, GameConstants.maxPosition);

    width = GameConstants.game.width;
    height = GameConstants.game.height;

    minVector = Vec2.new(0, 0);
    maxVector = Vec2.new(GameConstants.game.width, GameConstants.game.height);

    mapDirty = false;

    idAllocator = new IDAllocator(16);

    get nextEntityID(): number {
        return this.idAllocator.getNextId();
    }

    dt = 0;
    now = Date.now();

    private readonly timer = new NanoTimer();

    private readonly deltaMs: number;

    constructor(config: ServerConfig) {
        this.deltaMs = 1000 / config.tps;
        this.timer.setInterval(this.tick.bind(this), "", `${this.deltaMs}m`);
    }

    clampPosition(position: Vector, width: number, height: number){
        const maxVector = Vec2.sub(this.maxVector, Vec2.new(width, height));
        return Vec2.clampWithVector(
            position,
            Vec2.new(width, height),
            maxVector
        );
    }

    wsPlayerMap = new Map<WebSocket, ServerPlayer>();

    newPlayer(socket: WebSocket): ServerPlayer {
        const player = new ServerPlayer(this, socket);
        this.players.add(player);

        this.removePlayer(socket);

        this.wsPlayerMap.set(socket, player);

        return player;
    }

    removePlayer(socket: WebSocket): void {
        const player = this.wsPlayerMap.get(socket);
        if (player) {
            this.players.delete(player);
            player.destroy();

            console.log(`Game | "${player.name}" left the game.`);
        }
    }

    handleMessage(data: ArrayBuffer, wssocket: WebSocket): void {
        const packetStream = new PacketStream(data);

        const packet = packetStream.deserializeClientPacket();

        if (packet === undefined) return;

        const oldPlayer = this.wsPlayerMap.get(wssocket);
        if (packet instanceof JoinPacket) {
            const newPlayer = this.newPlayer(wssocket);
            if (oldPlayer) {
                const inventory = oldPlayer.inventory.inventory;
                const exp = oldPlayer.exp;

                newPlayer.inventory.inventory = inventory;
                newPlayer.addExp(exp);

                const spawnZones =
                    Object.values(Zones).filter(e => newPlayer.level >= e.spawningLevel)

                const spawnZone = spawnZones[spawnZones.length - 1];

                if (spawnZones.length) {
                    newPlayer.position = Random.vector(
                        spawnZone.x, spawnZone.x + spawnZone.width,
                        0, this.height
                    )
                }
            }

            return newPlayer.processMessage(packet);
        } else if (oldPlayer) {
            return oldPlayer.processMessage(packet);
        }
        return;
    }

    specialSpawnTimer = new Map<
        ZoneName, Map<SpecialSpawn, number>
    >();

    tick(): void {
        this.dt = (Date.now() - this.now) / 1000;
        this.now = Date.now();

        const activeEntities = new Set<ServerEntity>();

        const collisionTasks = new Set<CollisionTask>();

        // update entities
        for (const entity of this.grid.entities.values()) {
            if (entity.isActive()) activeEntities.add(entity);
        }

        for (const entity of activeEntities) {
            const collidedEntities =
                this.grid.intersectsHitbox(entity.hitbox);

            for (const collidedEntity of collidedEntities) {
                if (collidedEntity === entity) continue;
                if (!activeEntities.has(collidedEntity)) continue;

                const collision =
                    entity.hitbox.getIntersection(collidedEntity.hitbox);

                if (collision) {
                    if (isDamageableEntity(entity) && isDamageableEntity(collidedEntity)) {
                        entity.dealDamageTo(collidedEntity);
                    }

                    if (isCollideableEntity(entity) && isCollideableEntity(collidedEntity)) {
                        const task: CollisionTask = {
                            source: entity,
                            target: collidedEntity,
                            collision
                        }

                        collisionTasks.add(task)
                    }
                }
            }
        }

        for (const collisionTask of collisionTasks) {
            const { source, target, collision } = collisionTask;
            if (collision) {
                source.collideWith(collision, target);
            }
        }

        for (const entity of this.grid.entities.values()) {
            entity.tick();
        }

        // Cache entity serializations
        for (const entity of this.partialDirtyEntities) {
            if (this.fullDirtyEntities.has(entity)) {
                this.partialDirtyEntities.delete(entity);
                continue;
            }
            entity.serializePartial();
        }

        for (const entity of this.fullDirtyEntities) {
            entity.serializeFull();
        }

        // Second loop over players: calculate visible entities & send updates
        for (const player of this.players) {
            player.sendPackets();
        }

        // reset stuff
        for (const player of this.players) {
            for (const key in player.dirty) {
                player.dirty[key as keyof ServerPlayer["dirty"]] = false;
            }
        }

        this.partialDirtyEntities.clear();
        this.fullDirtyEntities.clear();
        this.mapDirty = false;

        for (const zoneKey in Zones) {
            const zone = Zones[zoneKey as ZoneName];

            this.mobSpawnerInZone(zone.normalSpawning, zone)

            if (zone.specialSpawning) {
                let zoneTimers =
                    this.specialSpawnTimer.get(zoneKey as ZoneName);
                if (!zoneTimers){
                    zoneTimers = new Map<SpecialSpawn, number>();
                }

                for (const specialSpawn of zone.specialSpawning) {
                    zoneTimers.set(specialSpawn, (zoneTimers.get(specialSpawn) ?? 0) + this.dt);
                    if ((zoneTimers.get(specialSpawn) ?? 0) >= specialSpawn.timer) {
                        this.mobSpawnerInZone(specialSpawn.spawn, zone)
                        zoneTimers.set(specialSpawn, 0)
                    }
                }

                this.specialSpawnTimer.set(zoneKey as ZoneName, zoneTimers);
            }
        }
    }

    mobSpawnerInZone(mobSpawner: MobSpawner, zone: Zone): void {
        const definitionIdString = Random.weightedRandom(
            Object.keys(mobSpawner),
            Object.values(mobSpawner)
        )

        const definition = Mobs.fromString(definitionIdString);

        const maxMobCount = zone.density / 15 * zone.width * this.height / 20;
        const mobCount = this.mobCountsInZone(zone);

        if (mobCount < maxMobCount) this.spawnMobInZone(definition, zone)
    }

    mobCountsInZone(zone: Zone): number {
        const collided = this.grid.intersectsHitbox(new RectHitbox(
            Vec2.new(zone.x, 0), Vec2.new(zone.x + zone.width, this.height)
        ));

        let mobCount = 0;

        for (const collidedElement of collided) {
            if (collidedElement instanceof ServerMob) mobCount++;
        }

        return mobCount;
    }

    spawnMobInZone(definition: MobDefinition, zone: Zone) {
        let collidedNumber = 0;
        let position = Random.vector(zone.x, zone.x + zone.width, 0, this.height);
        do {
            collidedNumber = 0;
            const hitbox = new CircleHitbox(definition.hitboxRadius + 2, position);
            const collided =
                this.grid.intersectsHitbox(hitbox);
            for (const collidedElement of collided) {
                if (collidedElement.hitbox.collidesWith(hitbox)) collidedNumber++;
            }
            position = Random.vector(zone.x, zone.x + zone.width, 0, this.height);
        } while (collidedNumber != 0);

        this.spawnMob(definition, position);
    }

    spawnMob(definition: MobDefinition, position: Vector) {
        if (definition.hasSegments) {
            spawnSegmentMobs(
                this,
                definition,
                position,
            )
        } else {
            new ServerMob(this,
                position,
                Vec2.radiansToDirection(Random.float(-P2, P2)),
                definition
            );
        }
        const rarity = Rarity.fromString(definition.rarity);
        if (rarity.globalMessage) {
            let content = `A ${rarity.displayName} ${definition.displayName} has spawned somewhere`
            this.sendGlobalMessage({
                content: content +"!",
                color: parseInt(rarity.color.substring(1), 16)
            })
        }
    }

    inWhichZone(entity: ServerEntity): Zone{
        for (const zonesKey in Zones) {
            const data = Zones[zonesKey as ZoneName];
            const zoneHitbox = new RectHitbox(
                Vec2.new(data.x, 0), Vec2.new(data.x + data.width, this.height)
            );
            const collided = this.grid.intersectsHitbox(zoneHitbox);
            if (collided.has(entity)) {
                const collision = entity.hitbox.collidesWith(zoneHitbox);
                if(collision) return data;
            }
        }

        return Object.values(Zones)[0];
    }

    gameHas(petal: PetalDefinition): boolean {
        for (const activePlayer of this.players) {
            if (activePlayer.inventory.inventory.includes(petal))
                return true;
        }

        for (const byCategoryElementElement of this.grid.byCategory[EntityType.Loot]) {
            if (byCategoryElementElement.definition === petal){
                return true;
            }
        }

        return false
    }

    rarityPetalCount(rarity: RarityName): number {
        let num = 0;

        for (const activePlayer of this.players) {
            activePlayer.inventory.inventory.forEach((e) => {
                if (e && e.rarity === rarity) num++;
            })
        }

        for (const byCategoryElementElement of this.grid.byCategory[EntityType.Loot]) {
            if (byCategoryElementElement.definition.rarity === rarity) num++;
        }

        return num
    }

    sendGlobalMessage(message: ChatData): void {
        for (const player of this.players) {
            player.chatMessagesToSend.push(message)
        }
    }

    leaderboard(): ServerPlayer[] {
        return Array.from(this.activePlayers).sort((a, b) => b.exp - a.exp);
    }
}

interface CollisionTask {
    source: collideableEntity;
    target: collideableEntity;
    collision: CollisionResponse;
}
