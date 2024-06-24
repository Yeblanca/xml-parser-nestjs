// src/xml-parser/xml-parser.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { parseStringPromise } from 'xml2js';
import Bottleneck from 'bottleneck';
import { PrismaService } from '../lib/prisma.service';
import { lastValueFrom } from 'rxjs';

interface Make {
  makeId: string;
  makeName: string;
  vehicleTypes: VehicleType[];
}

interface VehicleType {
  typeId: string;
  typeName: string;
}

@Injectable()
export class XmlParserService implements OnModuleInit {
  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const hasMakes = await this.checkMakeEntries();
    if (!hasMakes) {
      await this.fetchAndProcessMakes();
    }
  }

  async checkMakeEntries(): Promise<boolean> {
    const maxRetries = 5;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const makeCount = await this.prisma.make.count();
        return makeCount > 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: unknown | any) {
        console.error(`Attempt ${attempt + 1} failed: ${error.message}`);
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
      }
    }
    // const count = await this.prisma.make.count();
    // return count > 0;
  }

  // Fetch all makes from the NHTSA API
  async fetchMakes(): Promise<Make[]> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(
          'https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=XML',
        ),
      );
      const jsonData = await parseStringPromise(response.data);
      // return jsonData;

      return jsonData.Response.Results[0].AllVehicleMakes.map((make) => ({
        makeId: make.Make_ID[0],
        makeName: make.Make_Name[0],
        vehicleTypes: [],
      })).slice(0, 100);
    } catch (error) {
      console.error('Error fetching makes', error);
      return [];
    }
  }

  // Fetch vehicle types for a specific make ID
  async fetchVehicleTypesForMakeId(
    makeId: string,
    makeName: string,
  ): Promise<Make> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(
          `https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeId/${makeId}?format=xml`,
        ),
      );
      const data = await parseStringPromise(response.data);

      if (data.Response.Results[0].VehicleTypesForMakeIds === undefined) {
        return { makeId, makeName, vehicleTypes: [] };
      }

      const vehicleTypes = data.Response.Results[0].VehicleTypesForMakeIds.map(
        (result) => ({
          typeId: result.VehicleTypeId[0],
          typeName: result.VehicleTypeName[0],
        }),
      );

      return { makeId, makeName, vehicleTypes };
    } catch (error) {
      console.error('Error fetching vehicle types', error);
      return { makeId, makeName, vehicleTypes: [] };
    }
  }

  // Configure rate limiting with Bottleneck
  limiter = new Bottleneck({
    maxConcurrent: 5,
    minTime: 333,
  });

  private async fetchVehicleTypesForMakeIdWithRetry(
    makeId: string,
    makeName: string,
  ): Promise<Make> {
    return this.limiter.schedule(() =>
      this.fetchVehicleTypesForMakeId(makeId, makeName),
    );
  }

  private async processBatchWithRetry(
    batch: { makeId: string; makeName: string }[],
  ): Promise<void> {
    const results = await Promise.all(
      batch.map((make) =>
        this.fetchVehicleTypesForMakeIdWithRetry(make.makeId, make.makeName),
      ),
    );
    await this.saveDataToDatabase(results);
    Logger.log('Batch processed and saved:', results);
  }

  private async processBatches(
    batches: { makeId: string; makeName: string }[][],
  ): Promise<void> {
    for (const batch of batches) {
      await this.processBatchWithRetry(batch);
    }

    Logger.log('All batches processed and saved!');
  }

  private async saveDataToDatabase(data: Make[]): Promise<void> {
    const savePromises = data.map((make) =>
      this.prisma.make.create({
        data: {
          makeId: make.makeId,
          makeName: make.makeName,
          vehicleTypes: make.vehicleTypes.map((vt) => ({
            typeId: vt.typeId,
            typeName: vt.typeName,
          })),
        },
      }),
    );
    await Promise.all(savePromises);
  }

  // Fetch makes and process them in batches
  async fetchAndProcessMakes(): Promise<void> {
    const makes = await this.fetchMakes();
    const batchSize = 5;
    const batches = [];
    for (let i = 0; i < makes.length; i += batchSize) {
      batches.push(makes.slice(i, i + batchSize));
    }
    await this.processBatches(batches);
  }
}
