import { ServerProjectile } from "../serverProjectile";
import Missile from "../projectiles/Missile";

export const projectileMapped: Record<string, typeof ServerProjectile> = {
    missile: Missile
};
