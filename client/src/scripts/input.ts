import { Vec2 } from "@common/utils/vector.ts";
import { type Game } from "./game";
import { halfPI, PI } from "@common/utils/math.ts";
import { InputAction } from "@common/packets/inputPacket.ts";


export class Input {
    readonly game: Game;

    private _inputsDown: Record<string, boolean> = {};

    actionsToSend = new Set<InputAction>();

    /**
     * The angle between the mouse pointer and the screen center
     */
    mouseDirection = 0;

    /**
     * The distance between the mouse pointer and the screen center
     */
    mouseDistance = 0;

    /**
     * Gets if an input is down
     * @param input The input key or mouse button
     * Single keys must be upper case
     * Mouse buttons are `Mouse${ButtonNumber}`
     * @returns true if the bind is pressed
     */
    isInputDown(input: string): boolean {
        return this._inputsDown[input] ?? false;
    }

    get moveDirection(): {direction: number, mouseDirection: number} | undefined {
        if (this.game.app.settings.data.keyboardMovement) {
            let hMove = 0;
            let vMove = 0;
            if (this.isInputDown("KeyD")) hMove += 1;
            if (this.isInputDown("KeyA")) hMove -= 1;
            if (this.isInputDown("KeyW")) vMove += 1;
            if (this.isInputDown("KeyS")) vMove -= 1;

            const hRad = -halfPI * hMove + halfPI;
            const vRad = PI / 2 * vMove + PI / 2 + halfPI;

            const hDir = Vec2.radiansToDirection(hRad);
            const vDir = Vec2.radiansToDirection(vRad);

            if (hMove != 0 && vMove != 0) {
                return {
                    direction: Vec2.directionToRadians(Vec2.add(vDir, hDir)),
                    mouseDirection: this.mouseDirection
                };
            } else if (hMove != 0) {
                return {
                    direction: hRad,
                    mouseDirection: this.mouseDirection
                };
            } else if (vMove != 0) {
                return {
                    direction: vRad,
                    mouseDirection: this.mouseDirection
                };
            }

            return;
        }else {
            return {
                direction: this.mouseDirection,
                mouseDirection: this.mouseDirection
            };
        }
    }

    get moveDistance(): number {
        const maxDistance = 255;
        let distance: number;
        if (this.game.app.settings.data.keyboardMovement) {
            if (this.moveDirection != undefined) distance = maxDistance;
            else distance = 0;
        }else {
            distance = this.mouseDistance;
        }

        if (distance > maxDistance) return maxDistance;
        return distance;
    }

    mousePosition: {
        clientX: number,
        clientY: number
    } = {
        clientX: 0,
        clientY: 0
    };

    constructor(game: Game) {
        this.game = game;

        document.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });

        window.addEventListener("mousedown",
            this.handleMouseEvent.bind(this, true)
        );
        window.addEventListener("mouseup",
            this.handleMouseEvent.bind(this, false)
        );
        window.addEventListener("keydown",
            this.handleKeyboardEvent.bind(this, true));

        window.addEventListener("keyup",
            this.handleKeyboardEvent.bind(this, false))

        window.addEventListener("mousemove", e => {
            this.mouseDirection = Math.atan2(e.clientY - window.innerHeight / 2, e.clientX - window.innerWidth / 2);

            this.mouseDistance = Vec2.length(
                Vec2.new(
                    e.clientY - window.innerHeight / 2, e.clientX - window.innerWidth / 2
                )
            );

            this.mousePosition = {
                clientX: e.clientX,
                clientY: e.clientY
            }
        });
    }


    handleMouseEvent(down: boolean, event: MouseEvent): void {
        const key = this.getKeyFromInputEvent(event);

        this._inputsDown[key] = down;
    }

    handleKeyboardEvent(down: boolean, event: KeyboardEvent): void {
        if (!this.game.running) return;

        const key = this.getKeyFromInputEvent(event);

        const upperCaseKey = event.code;

        const input = document.querySelector("input.focused");


        if (upperCaseKey === "Enter" && down) {
            if (this.game.ui.chatInput.hasClass("focused")) {
                this.game.ui.sendChat();
            } else {
                this.game.ui.openChat();
            }
            return;
        }

        if (upperCaseKey === "Tab" && down) {
            if (this.game.ui.chatInput.hasClass("focused")) {
                this.game.ui.changeChatChannel();
            }
            return event.preventDefault();
        }

        if (input) return;

        if (down) {
            if (["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].includes(event.key)) {
                const index = event.key === "0" ? 9 : +event.key - 1;
                if (this.game.app.settings.data.newControl) {
                    if (this.isInputDown("KeyT")) {
                        this.game.inventory.deleteSlot(
                            this.game.inventory.equippedPetals.length + index
                        );
                    } else {
                        this.game.inventory.switchSlot(index);
                    }
                }else {
                    this.game.inventory.switchSelectingSlotTo(index);
                }
            }

            if (!this.game.app.settings.data.newControl) {
                if (upperCaseKey === "KeyQ") {
                    this.game.inventory.moveSelectSlot(-1);
                }

                if (upperCaseKey === "KeyE") {
                    this.game.inventory.moveSelectSlot(1);
                }

                if (upperCaseKey === "KeyT") {
                    this.game.inventory.deleteSelectingSlot();
                }
            }

            if (upperCaseKey === "KeyK") {
                this.game.ui.keyboardMovement.trigger("click");
            }

            if (upperCaseKey === "KeyG") {
                this.game.app.settings.changeSettings(
                    "hitbox", !this.game.app.settings.data.hitbox
                );
            }

            if (upperCaseKey === "KeyL") {
                this.game.app.settings.changeSettings(
                    "debug", !this.game.app.settings.data.debug
                );

                this.game.ui.renderDebug();
            }

            if (upperCaseKey === "KeyX" || upperCaseKey === "KeyR") {
                this.game.inventory.transformAllSlot();
            }
        }

        this._inputsDown[key] = down;
    }

    getKeyFromInputEvent(event: MouseEvent | KeyboardEvent): string {
        let key = "";
        if (event instanceof MouseEvent) {
            key = `Mouse${event.button}`;
        }

        if (event instanceof KeyboardEvent) {
            key = event.code;
        }

        return key;
    }
}
