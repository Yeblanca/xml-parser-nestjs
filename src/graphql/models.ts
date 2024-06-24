// src/graphql/models.ts

import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class MakeVehicleTypes {
  @Field(() => String)
  typeId: string;

  @Field(() => String)
  typeName: string;
}

@ObjectType()
export class Make {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  makeId: string;

  @Field(() => String)
  makeName: string;

  @Field(() => [MakeVehicleTypes])
  vehicleTypes: MakeVehicleTypes[];
}
