import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { plainToInstance } from 'class-transformer';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  
  @Injectable()
  export class SerializationInterceptor<T> implements NestInterceptor {
    constructor(private readonly dtoClass: new (...args: any[]) => T) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle().pipe(
        map(data => {
            
          if (typeof data !== 'object' || data?.message || data?.access_token) {
            return data;
          }
  
          return plainToInstance(this.dtoClass, data, {
            excludeExtraneousValues: true,
          });
        }),
      );
    }
  }
  