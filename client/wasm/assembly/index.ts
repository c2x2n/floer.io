export function removeArrayQuickly<T>(array: T[], index: number) {
    array[index] = array[array.length - 1];
    array.pop();
}
