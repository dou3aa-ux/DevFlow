import { Test, TestingModule } from '@nestjs/testing';
import { BugsController } from './bugs.controller';
import { BugsService } from './bugs.service';

describe('BugsController', () => {
  let controller: BugsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BugsController],
      providers: [BugsService],
    }).compile();

    controller = module.get<BugsController>(BugsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
