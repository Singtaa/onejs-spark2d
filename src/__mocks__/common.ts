export class float2 {
    constructor(public x: number, public y: number) { }
}

// @ts-ignore
globalThis.puer = {
    $typeof: jest.fn((t: any) => t)
}

globalThis.CS = {
    System: {
        Array: {
            // @ts-ignore
            CreateInstance: jest.fn((type: any, count: number) => {
                const arr: any[] = new Array(count).fill(null)
                // @ts-ignore
                arr.SetValue = (value: any, index: number) => {
                    arr[index] = value
                }
                return arr
            })
        }
    }
}