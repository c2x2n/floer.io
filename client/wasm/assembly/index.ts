export function removeArrayQuickly<T>(array: T[], index: i32) {
    array[index] = array[array.length - 1];
    array.pop();
}
