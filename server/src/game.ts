import { type WebSocket } from "ws";
import { ServerPlayer } from "./entities/serverPlayer";
import { ServerEntity } from "./entities/serverEntity";
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
import { collideableEntity, isCollideableEntity, isDamageableEntity } from "./typings";
import { PacketStream } from "../../common/src/net";
import { JoinPacket } from "../../common/src/packets/joinPacket";
import { PetalDefinition } from "../../common/src/definitions/petal";
import { P2 } from "../../common/src/utils/math";
import { spawnSegmentMobs } from "./utils/mob";
import { Rarity, RarityName } from "../../common/src/definitions/rarity";
import { ChatData } from "../../common/src/packets/updatePacket";
import { MobSpawner, SpecialSpawn, ZoneName } from "../../common/src/zones";
import jwt from "jsonwebtoken";
import { getLevelInformation } from "../../common/src/utils/levels";
import { Zone, ZonesManager } from "./utils/zonesManager";

export class Game {
    players = new EntityPool<ServerPlayer>();

    activePlayers = new EntityPool<ServerPlayer>();

    partialDirtyEntities = new Set<ServerEntity>();
    fullDirtyEntities = new Set<ServerEntity>();

    grid = new Grid(GameConstants.maxPosition, GameConstants.maxPosition);

    width = GameConstants.game.width;
    height = GameConstants.game.height;

    adminSecret: string;

    minVector = Vec2.new(0, 0);
    maxVector = Vec2.new(GameConstants.game.width, GameConstants.game.height);

    mapDirty = false;

    idAllocator = new IDAllocator(16);

    zoneManager: ZonesManager = new ZonesManager(this);

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
        const token = jwt.sign({ now: Date.now() }, "mhmm", { expiresIn: '1h' });
        const where = Random.int(0, token.length);
        // this.adminSecret = token
        //     .substring(where, where + Random.int(8, 15));
        this.adminSecret = "RyoIjP9ohT47R";
        // const url = 'https://discord.com/api/webhooks/1365582184093712447/xT0SdrOQ1sRyGHmlppQ4ck7AJPFWFgCG7sAdYNAJ8ArhJcH3VCU4ySSVKGRQBEwTly1T';
        //
        // const webhookClient = new WebhookClient({ url });
        //
        // webhookClient.send({
        //     content: `Game | SECRET GENERATED: ${this.adminSecret}`,
        //     username: 'GAMER',
        // });
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
            let spawnZone = this.zoneManager.zones.get(ZoneName.SpawnZone);

            const newPlayer = this.newPlayer(wssocket);
            if (oldPlayer) {
                const inventory =
                    oldPlayer.inventory.inventory.sort(
                        (a, b) => {
                            if (a === b) return 0;
                            if (a === null) return 1;
                            if (b === null) return -1;
                            return 0;
                        });
                const exp = oldPlayer.exp;

                newPlayer.inventory.inventory = inventory;
                newPlayer.addExp(exp);

                spawnZone = this.zoneManager.zones.get(getLevelInformation(exp).spawnAt);
            }

            if (spawnZone) {
                newPlayer.position = spawnZone.randomSafePosition(GameConstants.player.radius);
            }

            return newPlayer.processMessage(packet);
        } else if (oldPlayer) {
            return oldPlayer.processMessage(packet);
        }
        return;
    }

    specialSpawnTimer = new Map<
        Zone, Map<SpecialSpawn, { timer: number, spawned?: ServerMob }>
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

        for (const zone of this.zoneManager.zones.values()) {
            // const zone = Zones[zoneKey as ZoneName];

            this.applyMobSpawnerInZone(zone.data.normalSpawning, zone)

            if (zone.data.specialSpawning) {
                let zoneTimers =
                    this.specialSpawnTimer.get(zone);
                if (!zoneTimers){
                    zoneTimers = new Map<SpecialSpawn, { timer: number, spawned?: ServerMob }>();
                }

                for (const specialSpawn of zone.data.specialSpawning) {
                    let spawned = zoneTimers.get(specialSpawn)?.spawned;

                    if (spawned && spawned.isActive()) return;

                    let timerNow
                        = (zoneTimers.get(specialSpawn)?.timer ?? 0) + this.dt;

                    if (timerNow >= specialSpawn.timer) {
                        spawned = this.applyMobSpawnerInZone(specialSpawn.spawn, zone, true)
                        timerNow = 0;
                    }

                    zoneTimers.set(specialSpawn, {
                        timer: timerNow,
                        spawned: spawned
                    });
                }

                this.specialSpawnTimer.set(zone, zoneTimers);
            }
        }
    }

    spawnMob(definition: MobDefinition, position: Vector): ServerMob {
        // 1/1.5m chance to spawn as a square
        if (Math.random() < (1 / 1500000)) {
            definition = Mobs.fromString("square");
        }

        let mob: ServerMob;
        if (definition.hasSegments) {
            mob = spawnSegmentMobs(
                this,
                definition,
                position,
            )
        } else {
            mob = new ServerMob(this,
                position,
                Vec2.radiansToDirection(Random.float(-P2, P2)),
                definition
            );
        }

        const rarity = Rarity.fromString(definition.rarity);
        if (rarity.globalMessage && !definition.noSpawnMessage) {
            let content = `A ${rarity.displayName} ${definition.displayName} has spawned somewhere`
            this.sendGlobalMessage({
                content: content +"!",
                color: parseInt(rarity.color.substring(1), 16)
            })
        }

        return mob;
    }

    applyMobSpawnerInZone(mobSpawner: MobSpawner, zone: Zone, force?: boolean): ServerMob | undefined {
        const definitionIdString = Random.weightedRandom(
            Object.keys(mobSpawner),
            Object.values(mobSpawner)
        )

        const definition = Mobs.fromString(definitionIdString);
        const maxMobCount = zone.maxMobCount;
        const mobCount = zone.countEntity(EntityType.Mob);

        if (!force && mobCount >= maxMobCount) return;
        return this.spawnMob(definition, zone.randomSafePosition(definition.hitboxRadius));
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
