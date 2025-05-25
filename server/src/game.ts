import { type WebSocket } from "ws";
import { ServerPlayer } from "./entity/serverPlayer";
import { ServerEntity } from "./entity/serverEntity";
import { Grid } from "./systems/map/grid";
import { EntityPool } from "../../common/src/misc/entityPool";
import { EntityType, GameConstants } from "../../common/src/constants";
import NanoTimer from "nanotimer";
import { Config, type ServerConfig } from "./config";
import { IDAllocator } from "./systems/idAllocator";
import { UVector2D } from "../../common/src/engine/physics/uvector";
import { ServerMob } from "./entity/serverMob";
import { MobDefinition, Mobs } from "../../common/src/definitions/mobs";
import { Random } from "../../common/src/engine/maths/random";
import { PacketStream } from "../../common/src/engine/net/net";
import { JoinPacket } from "../../common/src/engine/net/packets/joinPacket";
import { PetalDefinition } from "../../common/src/definitions/petals";
import { P2 } from "../../common/src/engine/maths/constants";
import { Rarity, RarityName } from "../../common/src/definitions/rarities";
import { ChatData } from "../../common/src/engine/net/packets/updatePacket";
import { MobSpawner, SpecialSpawn, ZoneName } from "../../common/src/definitions/zones";
import { getLevelInformation } from "../../common/src/definitions/levels";
import { Zone, ZonesManager } from "./systems/map/zones";
import { ServerWall } from "./entity/serverWall";
import { spawnMob, spawnSegmentMobs } from "./entity/spawning/mob";
import { Walls } from "../../common/src/definitions/walls";
import { GameData } from "./gameContainer";
import VectorAbstract from "../../common/src/engine/physics/vectorAbstract";
import { Geometry } from "../../common/src/engine/maths/geometry";
import TeamGenerator from "./systems/teamGenerator";
import ServerLivelyEntity from "./entity/livelyEntity";

type SpecialSpawningTimer = { timer: number, toNextTimer: number, spawned?: ServerMob };

export class ServerGame {
    players = new EntityPool<ServerPlayer>();

    activePlayers = new EntityPool<ServerPlayer>();

    partialDirtyEntities = new Set<ServerEntity>();
    fullDirtyEntities = new Set<ServerEntity>();

    grid = new Grid(GameConstants.maxPosition, GameConstants.maxPosition);

    width = GameConstants.game.width;
    height = GameConstants.game.height;

    adminSecret: string = Config.adminSecret;

    maxVector = UVector2D.new(GameConstants.game.width, GameConstants.game.height);

    mapDirty = false;

    idAllocator = new IDAllocator(16);
    teamGenerator = new TeamGenerator();

    zoneManager: ZonesManager = new ZonesManager(this);

    get nextEntityID(): number {
        return this.idAllocator.getNextId();
    }

    dt = 0;
    now = Date.now();

    private readonly timer = new NanoTimer();

    private readonly deltaMs: number;

    data: GameData = {
        playerCount: 0
    };

    constructor(config: ServerConfig) {
        this.deltaMs = 1000 / config.tps;
        this.timer.setInterval(this.tick.bind(this), "", `${this.deltaMs}m`);

        for (const wall of Walls) {
            const { x, y, width, height } = wall;
            new ServerWall(this, UVector2D.new(x, y), UVector2D.new(x + width, y + height));
        }
    }

    clampPosition(p: VectorAbstract, width: number, height: number): VectorAbstract {
        const maxVector = UVector2D.sub(this.maxVector, UVector2D.new(width, height));
        const position = UVector2D.clone(p);
        return UVector2D.clampWithVector(
            position,
            UVector2D.new(width, height),
            maxVector
        );
    }

    wsPlayerMap = new Map<WebSocket, ServerPlayer>();

    newPlayer(socket: WebSocket): ServerPlayer {
        const player = new ServerPlayer(this, socket);
        this.players.add(player);

        this.removePlayer(socket);

        this.wsPlayerMap.set(socket, player);
        this.updateGameData();

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
                const inventory
                    = oldPlayer.inventory.inventory.sort(
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
                newPlayer.position.set(spawnZone.randomSafePosition(GameConstants.player.radius));
            }

            newPlayer.applyPhysics();

            return newPlayer.processMessage(packet);
        } else if (oldPlayer) {
            return oldPlayer.processMessage(packet);
        }
        return;
    }

    updateGameData() {
        this.data.playerCount = this.players.size;
        process.send?.(this.data);
    }

    specialSpawnTimer = new Map<
        Zone,
        Map<SpecialSpawn, SpecialSpawningTimer>
    >();

    tick(): void {
        this.dt = (Date.now() - this.now) / 1000;
        this.now = Date.now();

        this.grid.reset();

        const saved = new Set<ServerEntity>(this.grid.entities.values());

        for (const entity of saved) {
            this.grid.updateEntity(entity);
        }

        for (const entity of saved) {
            entity.cachedCollisions.clear();
            entity.getCollisions();
        }

        for (const entity of saved) {
            entity.tick();
            entity.applyPhysics(); // important
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

            this.applyMobSpawnerInZone(zone.data.normalSpawning, zone);

            if (zone.data.specialSpawning) {
                let zoneTimers
                    = this.specialSpawnTimer.get(zone);
                if (!zoneTimers) {
                    zoneTimers = new Map<SpecialSpawn, SpecialSpawningTimer>();
                }

                for (const specialSpawn of zone.data.specialSpawning) {
                    let spawned = zoneTimers.get(specialSpawn)?.spawned;
                    if (spawned?.isActive()) return;

                    let timerNow
                        = (zoneTimers.get(specialSpawn)?.timer ?? 0) + this.dt;
                    let toNextTimer
                        = (zoneTimers.get(specialSpawn)?.toNextTimer ?? 0);

                    if (!toNextTimer) {
                        if (typeof specialSpawn.timer === "number") {
                            toNextTimer = specialSpawn.timer;
                        } else {
                            toNextTimer = Random.float(
                                specialSpawn.timer.min,
                                specialSpawn.timer.max
                            );
                        }
                    }
                    if (timerNow >= toNextTimer) {
                        spawned = this.applyMobSpawnerInZone(specialSpawn.spawn, zone, true);
                        timerNow = 0;
                        toNextTimer = 0;
                    }

                    zoneTimers.set(specialSpawn, {
                        timer: timerNow,
                        spawned: spawned,
                        toNextTimer
                    });
                }

                this.specialSpawnTimer.set(zone, zoneTimers);
            }
        }
    }

    spawnMob(definition: MobDefinition, position: VectorAbstract): ServerMob {
        const mob = spawnMob(
            this,
            definition,
            position
        );

        const rarity = Rarity.fromString(definition.rarity);
        if (rarity.globalMessage && !definition.noSpawnMessage) {
            const content = `A ${rarity.displayName} ${definition.displayName} has spawned somewhere`;
            this.sendGlobalMessage({
                content: `${content}!`,
                color: parseInt(rarity.color.substring(1), 16)
            });
        }

        return mob;
    }

    applyMobSpawnerInZone(mobSpawner: MobSpawner, zone: Zone, force?: boolean): ServerMob | undefined {
        const definitionIdString = Random.weightedRandom(
            Object.keys(mobSpawner),
            Object.values(mobSpawner)
        );

        const definition = Mobs.fromString(definitionIdString);
        const maxMobCount = zone.maxMobCount;
        const mobCount = zone.countEntity(EntityType.Mob);

        if (!force && mobCount >= maxMobCount) return;
        return this.spawnMob(definition, zone.randomSafePosition(definition.hitboxRadius));
    }

    gameHas(petal: PetalDefinition): boolean {
        for (const activePlayer of this.players) {
            if (activePlayer.inventory.inventory.includes(petal)) { return true; }
        }

        for (const byCategoryElementElement of this.grid.byCategory[EntityType.Loot]) {
            if (byCategoryElementElement.definition === petal) {
                return true;
            }
        }

        return false;
    }

    giveTeam(id: number) {
        const entities = Array.from(this.grid.entities.values())
            .filter(e => (e instanceof ServerLivelyEntity)) as ServerLivelyEntity[];
        if (entities.find(e => e.team === id)) return;

        this.teamGenerator.give(id);
    }

    rarityPetalCount(rarity: RarityName): number {
        let num = 0;

        for (const activePlayer of this.players) {
            activePlayer.inventory.inventory.forEach(e => {
                if (e && e.rarity === rarity) num++;
            });
        }

        for (const byCategoryElementElement of this.grid.byCategory[EntityType.Loot]) {
            if (byCategoryElementElement.definition.rarity === rarity) num++;
        }

        return num;
    }

    sendGlobalMessage(message: ChatData): void {
        for (const player of this.players) {
            player.chatMessagesToSend.push(message);
        }
    }

    leaderboard(): ServerPlayer[] {
        return Array.from(this.activePlayers).sort((a, b) => b.exp - a.exp);
    }
}
