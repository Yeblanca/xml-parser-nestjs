import { Query, Resolver, Args } from '@nestjs/graphql';
import { PrismaService } from '../lib/prisma.service';
import { Make, MakeVehicleTypes } from './models';

@Resolver()
export class Resolvers {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [Make])
  async makes(
    @Args('first', { type: () => Number, nullable: true }) first?: number,
    @Args('skip', { type: () => Number, nullable: true }) skip?: number,
  ) {
    return this.prisma.make.findMany({
      take: first,
      skip: skip,
    });
  }

  @Query(() => [MakeVehicleTypes])
  async vehicleTypesByMake(
    @Args('makeId', { type: () => String }) makeId: string,
  ) {
    const make = await this.prisma.make.findMany({
      where: { makeId: makeId },
      select: { vehicleTypes: true },
    });
    return make[0]?.vehicleTypes ?? [];
  }
}
