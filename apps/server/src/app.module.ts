import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LangGraphModule } from './lang-graph/lang-graph.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    LangGraphModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
