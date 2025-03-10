
export const SystemArray = {
    CreateInstance: jest.fn((type: any, count: number) => {
        const arr: any[] = new Array(count).fill(null)
        // @ts-ignore
        arr.SetValue = (value: any, index: number) => {
            arr[index] = value
        }
        return arr
    })
}