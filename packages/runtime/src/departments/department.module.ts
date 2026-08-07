import { Module } from '@nestjs/common';
import { DepartmentRegistry } from './department-registry.js';
import { DepartmentMemoryManager } from './department-memory.js';

@Module({
  providers: [DepartmentRegistry, DepartmentMemoryManager],
  exports: [DepartmentRegistry, DepartmentMemoryManager],
})
export class DepartmentModule {}
