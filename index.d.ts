/// <reference path="./dist/index.d.ts" />
/// <reference path="./src/spark2d.d.ts" />

export * from './dist/index'

declare module "Spark2D" {
    export = CS.Spark2D;
}