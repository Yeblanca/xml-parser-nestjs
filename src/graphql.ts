// eslint-disable-next-line prettier/prettier

/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export interface MakeVehicleTypes {
  typeId?: Nullable<string>;
  typeName?: Nullable<string>;
}

export interface Make {
  id?: Nullable<string>;
  makeId?: Nullable<string>;
  makeName?: Nullable<string>;
  vehicleTypes?: Nullable<Nullable<MakeVehicleTypes>[]>;
}

export interface IQuery {
  makes(
    first?: Nullable<number>,
    skip?: Nullable<number>,
  ): Nullable<Nullable<Make>[]> | Promise<Nullable<Nullable<Make>[]>>;
  vehicleTypesByMake(
    makeId: string,
  ):
    | Nullable<Nullable<MakeVehicleTypes>[]>
    | Promise<Nullable<Nullable<MakeVehicleTypes>[]>>;
}

type Nullable<T> = T | null;
